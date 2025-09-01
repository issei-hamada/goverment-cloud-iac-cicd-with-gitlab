import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GitLab } from '../construct/gitlab';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

export interface GitLabStackProps extends cdk.StackProps {
  env: cdk.Environment;
  instanceType?: string;
  volumeSize?: number;
  keyPairName?: string;
  allowedCidrBlocks?: string[];
  hostedZoneId?: string;
  domainName?: string;
}

export class GitLabStack extends cdk.Stack {
  public readonly gitlab: GitLab;

  constructor(scope: Construct, id: string, props: GitLabStackProps) {
    super(scope, id, props);

    const instanceType = props.instanceType 
      ? new ec2.InstanceType(props.instanceType)
      : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE);

    this.gitlab = new GitLab(this, 'GitLab', {
      instanceType,
      volumeSize: props.volumeSize || 100,
      keyPairName: props.keyPairName,
      allowedCidrBlocks: props.allowedCidrBlocks || ['0.0.0.0/0'],
      hostedZoneId: props.hostedZoneId,
      domainName: props.domainName,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.gitlab.vpc.vpcId,
      description: 'VPC ID for GitLab',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.gitlab.securityGroup.securityGroupId,
      description: 'Security Group ID for GitLab',
      exportName: `${this.stackName}-SecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'InstanceRoleArn', {
      value: this.gitlab.role.roleArn,
      description: 'IAM Role ARN for GitLab Instance',
      exportName: `${this.stackName}-InstanceRoleArn`,
    });

    cdk.Tags.of(this).add('Project', 'GitLab');
    cdk.Tags.of(this).add('Environment', 'CICD');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}