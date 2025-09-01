import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IamRole } from '../construct/iam';

export interface CdkRoleStackProps extends cdk.StackProps {
  env: cdk.Environment;
  trustedCdkDiffCodeBuildRoleArn: string;
  trustedCdkDeployCodeBuildRoleArn: string;
}

export class CdkRoleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CdkRoleStackProps) {
    super(scope, id, props);

    new IamRole(this, 'IamRole', {
      env: props.env,
      trustedCdkDiffCodeBuildRoleArn: props.trustedCdkDiffCodeBuildRoleArn,
      trustedCdkDeployCodeBuildRoleArn: props.trustedCdkDeployCodeBuildRoleArn,
    });
  }
}
