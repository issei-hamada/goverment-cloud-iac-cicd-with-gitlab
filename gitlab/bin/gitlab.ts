#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { gitlabParameter } from '../parameter';
import { GitLabStack } from '../lib/stack/gitlab-stack';

const app = new cdk.App();

new GitLabStack(app, 'GitLab', {
  env: {
    account: gitlabParameter.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: gitlabParameter.env?.region || process.env.CDK_DEFAULT_REGION,
  },
  instanceType: gitlabParameter.gitlabInstanceType,
  volumeSize: gitlabParameter.gitlabVolumeSize,
  keyPairName: gitlabParameter.gitlabKeyPairName,
  allowedCidrBlocks: gitlabParameter.gitlabAllowedCidrBlocks,
  hostedZoneId: gitlabParameter.hostedZoneId,
  domainName: gitlabParameter.domainName,
});