import * as cdk from 'aws-cdk-lib';
import {
  aws_iam as iam,
  aws_codebuild as codebuild,
  aws_codepipeline as codepipeline,
  aws_codepipeline_actions as codepipeline_actions,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface PipelineProps {
  env: cdk.Environment;
  codeConnectionArn: string;
  gitlabTargetProject: string;
  artifactRepositoryRegion: string;
  artifactRepositoryDomain: string;
  artifactRepositoryName: string;
  developBranch: string;
  stagingBranch: string;
  productionBranch: string;
  stagingCdkDeployRequireApproval: boolean;
  stagingCdkDeployApproverRoles: string[];
  stagingAccount: string;
  stagingCdkDiffOptions: string;
  stagingCdkDeployOptions: string;
  cicdCdkDiffOptions: string;
  cicdCdkDeployOptions: string;
  cicdCdkDeployRequireApproval: boolean;
  cicdCdkDeployApproverRoles: string[];
}

export class Pipeline extends Construct {
  public readonly stagingCdkDiffCodeBuildRoleArn: string;
  public readonly stagingCdkDeployCodeBuildRoleArn: string;
  public readonly cdkDiffRoleName: string = 'Cicd-Pipeline-CdkDiffRole';
  public readonly cdkDeployRoleName: string = 'Cicd-Pipeline-CdkDeployRole';

  constructor(scope: Construct, id: string, props: PipelineProps) {
    super(scope, id);

    const addPoliciesToProject = (project: codebuild.Project) => {
      project.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['sts:AssumeRole'],
          resources: ['*'],
        }),
      );
      project.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['sts:GetServiceBearerToken'],
          resources: ['*'],
        }),
      );
      project.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['codeartifact:*'],
          resources: ['*'],
        }),
      );
    };

    const createBuildProject = (id: string, targetAccount: string, targetRoleName: string, buildCommand: string) => {
      const project = new codebuild.Project(this, id, {
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                `aws codeartifact login --tool npm --repository ${props.artifactRepositoryName} --domain ${props.artifactRepositoryDomain} --domain-owner ${cdk.Stack.of(this).account} --region ${props.artifactRepositoryRegion}`,
              ],
            },
            build: {
              commands:
                props.env.account === targetAccount
                  ? [`npm ci`, `${buildCommand}`]
                  : [
                      `npm ci`,
                      `credentials=$(aws sts assume-role --role-arn arn:aws:iam::${targetAccount}:role/${targetRoleName} --role-session-name BuildSession | jq .Credentials)`,
                      `export AWS_ACCESS_KEY_ID=$(echo \${credentials} | jq -r .AccessKeyId)`,
                      `export AWS_SECRET_ACCESS_KEY=$(echo \${credentials} | jq -r .SecretAccessKey)`,
                      `export AWS_SESSION_TOKEN=$(echo \${credentials} | jq -r .SessionToken)`,
                      `${buildCommand}`,
                    ],
            },
          },
        }),
      });

      addPoliciesToProject(project);
      return project;
    };

    const createCdkDiffPipeline = (
      id: string,
      buildBranch: string,
      triggerBranch: string,
      buildProject: codebuild.Project,
    ) => {
      const sourceOutput = new codepipeline.Artifact();
      const buildOutput = new codepipeline.Artifact();

      const pipeline = new codepipeline.Pipeline(this, id, {
        pipelineType: codepipeline.PipelineType.V2,
        executionMode: codepipeline.ExecutionMode.QUEUED,
        pipelineName: id,
      });

      // Note: GitLab merge request triggers are not directly supported by CodeConnections
      // This pipeline will trigger on branch updates instead
      const pipelineSourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
        actionName: 'Source',
        connectionArn: props.codeConnectionArn,
        owner: props.gitlabTargetProject.split('/')[0],
        repo: props.gitlabTargetProject.split('/')[1],
        branch: buildBranch,
        output: sourceOutput,
      });

      const pipelineBuildAction = new codepipeline_actions.CodeBuildAction({
        actionName: 'Test',
        project: buildProject,
        input: sourceOutput,
        outputs: [buildOutput],
      });

      pipeline.addStage({
        stageName: 'Source',
        actions: [pipelineSourceAction],
      });

      pipeline.addStage({
        stageName: 'Test',
        actions: [pipelineBuildAction],
      });
    };

    const createCdkDeployPipeline = (
      id: string,
      branch: string,
      testProject: codebuild.Project,
      buildProject: codebuild.Project,
      addApproval: boolean,
    ) => {
      const sourceOutput = new codepipeline.Artifact();
      const testOutput = new codepipeline.Artifact();
      const buildOutput = new codepipeline.Artifact();

      const stages: codepipeline.StageProps[] = [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeStarConnectionsSourceAction({
              actionName: 'Source',
              connectionArn: props.codeConnectionArn,
              owner: props.gitlabTargetProject.split('/')[0],
              repo: props.gitlabTargetProject.split('/')[1],
              branch: branch,
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Test',
              project: testProject,
              input: sourceOutput,
              outputs: [testOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Deploy',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
      ];

      if (addApproval) {
        stages.splice(2, 0, {
          stageName: 'Approval',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'Approval',
              runOrder: 1,
            }),
          ],
        });
      }

      const pipeline = new codepipeline.Pipeline(this, id, {
        pipelineType: codepipeline.PipelineType.V2,
        executionMode: codepipeline.ExecutionMode.QUEUED,
        pipelineName: id,
        stages: stages,
      });
      return pipeline;
    };

    const createCdkDeployApprovalPolicy = (id: string, pipeline: codepipeline.Pipeline) => {
      const iamPolicy = new iam.ManagedPolicy(this, id, {
        managedPolicyName: id,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['codepipeline:ListPipelines', 'codepipeline:ListPipelineExecutions'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['codepipeline:GetPipeline', 'codepipeline:GetPipelineState', 'codepipeline:GetPipelineExecution'],
            resources: [pipeline.pipelineArn],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['codepipeline:PutApprovalResult'],
            resources: [`${pipeline.pipelineArn}/*`],
          }),
        ],
      });
      return iamPolicy;
    };

    const attachApprovalPolicyToRole = (id: string, policy: iam.ManagedPolicy, roles: string[]) => {
      roles.forEach((roleName) => {
        const role = iam.Role.fromRoleName(this, `${id}-${roleName}`, roleName);
        policy.attachToRole(role);
      });
    };

    // 検証環境用
    const stagingCdkDiffProject = createBuildProject(
      'StagingCdkDiffProject',
      props.stagingAccount,
      this.cdkDiffRoleName,
      `npx cdk diff ${props.stagingCdkDiffOptions}`,
    );
    this.stagingCdkDiffCodeBuildRoleArn = stagingCdkDiffProject.role!.roleArn;
    const stagingCdkDeployProject = createBuildProject(
      'StagingCdkDeployProject',
      props.stagingAccount,
      this.cdkDeployRoleName,
      `npx cdk deploy ${props.stagingCdkDeployOptions}`,
    );
    this.stagingCdkDeployCodeBuildRoleArn = stagingCdkDeployProject.role!.roleArn;

    createCdkDiffPipeline(
      'StagingCdkDiffPipeline',
      props.developBranch,
      props.stagingBranch,
      stagingCdkDiffProject,
    );

    const stagingCdkDeployPipeline = createCdkDeployPipeline(
      'StagingCdkDeployPipeline',
      props.stagingBranch,
      stagingCdkDiffProject,
      stagingCdkDeployProject,
      props.stagingCdkDeployRequireApproval,
    );

    if (props.stagingCdkDeployRequireApproval) {
      const stagingCdkDeployApprovalPolicy = createCdkDeployApprovalPolicy(
        'StagingCdkDeployApprovalPolicy',
        stagingCdkDeployPipeline,
      );
      if (props.stagingCdkDeployApproverRoles.length > 0) {
        attachApprovalPolicyToRole(
          'StagingAttachApprovalPolicyToRole',
          stagingCdkDeployApprovalPolicy,
          props.stagingCdkDeployApproverRoles,
        );
      }
    }

    // CICD環境用
    const cicdCdkDiffProject = createBuildProject(
      'CicdCdkDiffProject',
      props.env.account!,
      this.cdkDiffRoleName,
      `npx cdk diff ${props.cicdCdkDiffOptions}`,
    );
    const cicdCdkDeployProject = createBuildProject(
      'CicdCdkDeployProject',
      props.env.account!,
      this.cdkDeployRoleName,
      `npx cdk deploy ${props.cicdCdkDeployOptions}`,
    );

    const cicdCdkDeployPipeline = createCdkDeployPipeline(
      'CicdCdkDeployPipeline',
      props.productionBranch,
      cicdCdkDiffProject,
      cicdCdkDeployProject,
      props.cicdCdkDeployRequireApproval,
    );
    if (props.cicdCdkDeployRequireApproval) {
      const cicdCdkDeployApprovalPolicy = createCdkDeployApprovalPolicy(
        'CicdCdkDeployApprovalPolicy',
        cicdCdkDeployPipeline,
      );
      if (props.cicdCdkDeployApproverRoles.length > 0) {
        attachApprovalPolicyToRole(
          'CicdAttachApprovalPolicyToRole',
          cicdCdkDeployApprovalPolicy,
          props.cicdCdkDeployApproverRoles,
        );
      }
    }
  }
}
