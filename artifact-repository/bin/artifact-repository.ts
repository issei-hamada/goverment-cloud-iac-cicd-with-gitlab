#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { commonParameter } from '../parameter';
import { ArtifactRepositoryStack } from '../lib/stack/artifact-repository-stack';

const app = new cdk.App();

new ArtifactRepositoryStack(app, 'Common-ArtifactRepository', {
  env: {
    account: commonParameter.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: commonParameter.env?.region || process.env.CDK_DEFAULT_REGION,
  },
});
