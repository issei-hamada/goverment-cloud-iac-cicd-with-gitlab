#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { cicdParameter } from '../parameter';
import { PipelineStack } from '../lib/stack/pipeline-stack';

const app = new cdk.App();

new PipelineStack(app, 'Cicd-Pipeline', {
  env: {
    account: cicdParameter.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: cicdParameter.env?.region || process.env.CDK_DEFAULT_REGION,
  },

  stagingAccount: cicdParameter.stagingAccount,
  artifactRepositoryRegion: cicdParameter.artifactRepositoryRegion,
  artifactRepositoryDomain: cicdParameter.artifactRepositoryDomain,
  artifactRepositoryName: cicdParameter.artifactRepositoryName,
  cicdCodeRepositoryName: cicdParameter.cicdCodeRepositoryName,
  systemCodeRepositoryName: cicdParameter.systemCodeRepositoryName,
  developBranch: cicdParameter.developBranch,
  stagingBranch: cicdParameter.stagingBranch,
  productionBranch: cicdParameter.productionBranch,
  codeCommitUserRoles: cicdParameter.codeCommitUserRoles,
  stagingCdkDeployRequireApproval: cicdParameter.stagingCdkDeployRequireApproval,
  stagingCdkDeployApproverRoles: cicdParameter.stagingCdkDeployApproverRoles,
  stagingCdkDiffOptions: cicdParameter.stagingCdkDiffOptions,
  stagingCdkDeployOptions: cicdParameter.stagingCdkDeployOptions,
  cicdCdkDiffOptions: cicdParameter.cicdCdkDiffOptions,
  cicdCdkDeployOptions: cicdParameter.cicdCdkDeployOptions,
  cicdCdkDeployRequireApproval: cicdParameter.cicdCdkDeployRequireApproval,
  cicdCdkDeployApproverRoles: cicdParameter.cicdCdkDeployApproverRoles,
  codeConnectionArn: cicdParameter.codeConnectionArn,
  gitlabTargetProject: cicdParameter.gitlabTargetProject,
});
