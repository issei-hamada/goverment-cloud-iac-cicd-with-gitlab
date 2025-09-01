import { Environment } from 'aws-cdk-lib';

// Parameters for Application
export interface AppParameter {
  env?: Environment;
}

// Parameters for CI/CD Account
export const commonParameter: AppParameter = {
  env: {
    account: '781642237558',
    region: 'ap-northeast-1',
  },
};
