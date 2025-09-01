#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { stgParameter } from '../parameter';
import { CdkRoleStack } from '../lib/stack/cdk-role-stack';

const app = new cdk.App();

new CdkRoleStack(app, 'Stg-CdkRole', {
  env: {
    account: stgParameter.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: stgParameter.env?.region || process.env.CDK_DEFAULT_REGION,
  },

  trustedCdkDiffCodeBuildRoleArn: stgParameter.trustedCdkDiffCodeBuildRoleArn,
  trustedCdkDeployCodeBuildRoleArn: stgParameter.trustedCdkDeployCodeBuildRoleArn,
});
