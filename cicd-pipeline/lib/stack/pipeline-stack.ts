import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Pipeline } from '../construct/pipeline';

export interface PipelineStackProps extends cdk.StackProps {
  env: cdk.Environment;
  stagingAccount: string;
  artifactRepositoryRegion: string;
  artifactRepositoryDomain: string;
  artifactRepositoryName: string;
  cicdCodeRepositoryName: string;
  systemCodeRepositoryName: string;
  developBranch: string;
  stagingBranch: string;
  productionBranch: string;
  codeCommitUserRoles: string[];
  stagingCdkDeployRequireApproval: boolean;
  stagingCdkDeployApproverRoles: string[];
  stagingCdkDiffOptions: string;
  stagingCdkDeployOptions: string;
  cicdCdkDiffOptions: string;
  cicdCdkDeployOptions: string;
  cicdCdkDeployRequireApproval: boolean;
  cicdCdkDeployApproverRoles: string[];
  codeConnectionArn: string;
  gitlabTargetProject: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // CodeRepository is no longer needed when using CodeConnections
    // const codeRepository = new CodeRepository(this, 'CodeRepository', {
    //   cicdCodeRepositoryName: props.cicdCodeRepositoryName,
    //   systemCodeRepositoryName: props.systemCodeRepositoryName,
    //   developBranch: props.developBranch,
    //   stagingBranch: props.stagingBranch,
    //   productionBranch: props.productionBranch,
    //   codeCommitUserRoles: props.codeCommitUserRoles,
    // });

    const pipeline = new Pipeline(this, 'Pipeline', {
      env: props.env,
      stagingAccount: props.stagingAccount,
      codeConnectionArn: props.codeConnectionArn,
      gitlabTargetProject: props.gitlabTargetProject,
      artifactRepositoryRegion: props.artifactRepositoryRegion,
      artifactRepositoryDomain: props.artifactRepositoryDomain,
      artifactRepositoryName: props.artifactRepositoryName,
      stagingCdkDeployRequireApproval: props.stagingCdkDeployRequireApproval,
      stagingCdkDeployApproverRoles: props.stagingCdkDeployApproverRoles,
      developBranch: props.developBranch,
      stagingBranch: props.stagingBranch,
      productionBranch: props.productionBranch,
      stagingCdkDiffOptions: props.stagingCdkDiffOptions,
      stagingCdkDeployOptions: props.stagingCdkDeployOptions,
      cicdCdkDiffOptions: props.cicdCdkDiffOptions,
      cicdCdkDeployOptions: props.cicdCdkDeployOptions,
      cicdCdkDeployRequireApproval: props.cicdCdkDeployRequireApproval,
      cicdCdkDeployApproverRoles: props.cicdCdkDeployApproverRoles,
    });

    new cdk.CfnOutput(this, 'StagingCdkDiffCodeBuildRoleArn', {
      value: pipeline.stagingCdkDiffCodeBuildRoleArn,
    });
    new cdk.CfnOutput(this, 'StagingCdkDeployCodeBuildRoleArn', {
      value: pipeline.stagingCdkDeployCodeBuildRoleArn,
    });
  }
}
