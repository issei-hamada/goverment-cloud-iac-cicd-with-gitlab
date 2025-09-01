import { Environment } from 'aws-cdk-lib';

// Parameters for GitLab
export interface GitLabParameter {
  env?: Environment;
  gitlabInstanceType: string;
  gitlabVolumeSize: number;
  gitlabKeyPairName?: string;
  gitlabAllowedCidrBlocks: string[];
  hostedZoneId?: string;
  domainName?: string;
}

// Parameters for GitLab deployment
export const gitlabParameter: GitLabParameter = {
  env: {
    account: 'xxxxxxxxxxxx', // GitLab をデプロイする AWS アカウント ID
    region: 'ap-northeast-1',
  },
  gitlabInstanceType: 't3.large',
  gitlabVolumeSize: 100,
  gitlabKeyPairName: 'GitLab',
  gitlabAllowedCidrBlocks: [
    '0.0.0.0/0', // 本番環境では適切なIPアドレス範囲に制限してください
  ],
  hostedZoneId: 'xxxxxxxxxxxxxxxxx', // Route53のホストゾーンID
  domainName: 'example.com', // ドメイン名
};