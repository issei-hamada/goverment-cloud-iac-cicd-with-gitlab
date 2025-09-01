import { Environment } from 'aws-cdk-lib';

// Parameters for Application
export interface AppParameter {
  env?: Environment;
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
  // CodeConnections parameters
  codeConnectionArn: string;
  gitlabTargetProject: string;
}

// Parameters for CICD
export const cicdParameter: AppParameter = {
  env: {
    account: 'xxxxxxxxxxxx',
    region: 'ap-northeast-1',
  },
  stagingAccount: 'xxxxxxxxxxxx',

  artifactRepositoryRegion: 'ap-northeast-1',
  artifactRepositoryDomain: 'commonartifactrepositoryxxxxxxx',
  artifactRepositoryName: 'Npm',

  cicdCodeRepositoryName: 'CicdPipelineCicd',
  systemCodeRepositoryName: 'CicdPipelineSystem',

  developBranch: 'develop',
  stagingBranch: 'staging',
  productionBranch: 'production',

  codeCommitUserRoles: [],

  stagingCdkDeployRequireApproval: false,
  stagingCdkDeployApproverRoles: [],

  stagingCdkDiffOptions: '--all',
  stagingCdkDeployOptions: '--all --require-approval never',

  cicdCdkDiffOptions: '--all',
  cicdCdkDeployOptions: '--all --require-approval never',
  cicdCdkDeployRequireApproval: true,
  cicdCdkDeployApproverRoles: [],

  // CodeConnections parameters
  codeConnectionArn: 'arn:aws:codeconnections:ap-northeast-1:xxxxxxxxxxxx:connection/xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // 実際のARNに置き換えてください
  gitlabTargetProject: 'development-group/cicd-workshop', // 実際のGitLabプロジェクト（組織名/プロジェクト名）に置き換えてください
};
