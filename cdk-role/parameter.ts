import { Environment } from 'aws-cdk-lib';

// Parameters for Application
export interface AppParameter {
  env?: Environment;
  trustedCdkDiffCodeBuildRoleArn: string;
  trustedCdkDeployCodeBuildRoleArn: string;
}

// Parameters for Stg Account
export const stgParameter: AppParameter = {
  env: {
    account: '111111111111',
    region: 'ap-northeast-1',
  },
  trustedCdkDeployCodeBuildRoleArn:
    'arn:aws:iam::111111111111:role/Cicd-Pipeline-PipelineStagingCdkDeplooXXXXXXXXXXXXXXXXXXXXXXXXXX',
  trustedCdkDiffCodeBuildRoleArn:
    'arn:aws:iam::111111111111:role/Cicd-Pipeline-PipelineStagingCdkDiffXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
};
