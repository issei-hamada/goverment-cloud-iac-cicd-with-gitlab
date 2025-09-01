import * as cdk from 'aws-cdk-lib';
import {
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_route53 as route53,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

export interface GitLabProps {
  instanceType?: ec2.InstanceType;
  volumeSize?: number;
  keyPairName?: string;
  allowedCidrBlocks?: string[];
  hostedZoneId?: string;
  domainName?: string;
}

export class GitLab extends Construct {
  public readonly instance: ec2.Instance;
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props?: GitLabProps) {
    super(scope, id);

    const instanceType = props?.instanceType || ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE);
    const volumeSize = props?.volumeSize || 100;
    const allowedCidrBlocks = props?.allowedCidrBlocks || ['0.0.0.0/0'];

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    this.vpc = vpc;

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Security group for GitLab EC2 instance',
      allowAllOutbound: true,
    });
    this.securityGroup = securityGroup;

    allowedCidrBlocks.forEach((cidr) => {
      securityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(22),
        `Allow SSH from ${cidr}`
      );
      securityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(80),
        `Allow HTTP from ${cidr}`
      );
      securityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(443),
        `Allow HTTPS from ${cidr}`
      );
    });

    const role = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });
    this.role = role;

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: ['arn:aws:logs:*:*:*'],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:GetObject',
          's3:ListBucket',
        ],
        resources: ['*'],
      })
    );

    const userData = ec2.UserData.forLinux();
    const userDataScript = fs.readFileSync(
      path.join(__dirname, '../sh/gitlab-install.sh'),
      'utf-8'
    );
    userData.addCommands(userDataScript);

    const keyPairName = props?.keyPairName || 'GitLab';
    const keyPair = new ec2.KeyPair(this, 'KeyPair', {
      keyPairName: keyPairName,
    });
    
    new cdk.CfnOutput(this, 'KeyPairName', {
      value: keyPair.keyPairName,
      description: 'Created Key Pair Name for GitLab EC2 Instance',
    });

    const instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType,
      machineImage: ec2.MachineImage.genericLinux({
        'ap-northeast-1': 'ami-0a71a0b9c988d5e5e',
      }),
      securityGroup,
      role,
      userData,
      keyPair: keyPair,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(volumeSize, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });
    this.instance = instance;

    const eip = new ec2.CfnEIP(this, 'EIP', {
      domain: 'vpc',
    });

    new ec2.CfnEIPAssociation(this, 'EIPAssociation', {
      allocationId: eip.attrAllocationId,
      instanceId: instance.instanceId,
    });

    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'GitLab EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'ElasticIp', {
      value: eip.ref,
      description: 'GitLab EC2 Instance Elastic IP',
    });

    new cdk.CfnOutput(this, 'GitLabUrl', {
      value: `https://${eip.ref}`,
      description: 'GitLab URL (DNS configuration required)',
    });

    if (props?.hostedZoneId && props?.domainName) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      });

      new route53.ARecord(this, 'GitLabARecord', {
        zone: hostedZone,
        recordName: `gitlab.${props.domainName}`,
        target: route53.RecordTarget.fromIpAddresses(eip.ref),
        ttl: cdk.Duration.minutes(5),
      });

      new cdk.CfnOutput(this, 'GitLabDomainUrl', {
        value: `https://gitlab.${props.domainName}`,
        description: 'GitLab URL with custom domain',
      });
    }
  }
}