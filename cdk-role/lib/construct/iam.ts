import * as cdk from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface IamRoleProps {
  env: cdk.Environment;
  trustedCdkDiffCodeBuildRoleArn: string;
  trustedCdkDeployCodeBuildRoleArn: string;
}

export class IamRole extends Construct {
  public readonly cdkRoleQualifier: string = 'hnb659fds';
  public readonly cdkDiffRoleName: string = 'Cicd-Pipeline-CdkDiffRole';
  public readonly cdkDeployRoleName: string = 'Cicd-Pipeline-CdkDeployRole';

  constructor(scope: Construct, id: string, props: IamRoleProps) {
    super(scope, id);

    const cdkDiffRole = new iam.Role(this, 'CdkDiffRole', {
      assumedBy: new iam.CompositePrincipal(new iam.ArnPrincipal(props.trustedCdkDiffCodeBuildRoleArn)),
      roleName: this.cdkDiffRoleName,
    });
    cdkDiffRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${props.env.account}:role/cdk-${this.cdkRoleQualifier}-lookup-role-*`],
      }),
    );
    const cdkDeployRole = new iam.Role(this, 'CdkDeployRole', {
      assumedBy: new iam.CompositePrincipal(new iam.ArnPrincipal(props.trustedCdkDeployCodeBuildRoleArn)),
      roleName: this.cdkDeployRoleName,
    });
    cdkDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [`arn:aws:iam::${props.env.account}:role/cdk-${this.cdkRoleQualifier}-*`],
      }),
    );
  }
}
