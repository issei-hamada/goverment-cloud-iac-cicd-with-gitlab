import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from '../construct/repository';

export class ArtifactRepositoryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new Repository(this, 'Repository');

    new cdk.CfnOutput(this, 'RepositoryDomain', {
      value: repository.repositoryDomain,
    });
    new cdk.CfnOutput(this, 'RepositoryName', {
      value: repository.repositoryName,
    });
  }
}
