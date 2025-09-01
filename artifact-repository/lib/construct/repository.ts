import * as cdk from 'aws-cdk-lib';
import { aws_codeartifact as codeartifact } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class Repository extends Construct {
  public readonly repositoryDomain: string;
  public readonly repositoryName: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const domain = new codeartifact.CfnDomain(this, 'Domain', {
      domainName: cdk.Names.uniqueResourceName(this, {}).toLowerCase(),
    });

    const public_repository = new codeartifact.CfnRepository(this, 'PublicNpmRepository', {
      repositoryName: 'PublicNpm',
      externalConnections: ['public:npmjs'],
      domainName: domain.domainName!,
    });

    const repository = new codeartifact.CfnRepository(this, 'NpmRepository', {
      repositoryName: 'Npm',
      domainName: domain.domainName!,
      upstreams: ['PublicNpm'],
    });
    this.repositoryDomain = repository.domainName!;
    this.repositoryName = repository.repositoryName;

    public_repository.node.addDependency(domain);
    repository.node.addDependency(domain);
    repository.node.addDependency(public_repository);
  }
}
