import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

import { BaseStack, BaseStackProps, putParameter, SSM_KEYS } from "../base";

export interface Ec2StackProps extends BaseStackProps {
  vpc: ec2.IVpc;
  /** SSH(22) 접속을 허용할 IP 대역. 비어 있으면 인바운드 규칙을 만들지 않는다 */
  sshAllowedCidrs: string[];
}

/**
 * Bastion EC2 스택 (stateful — 사람이 수동 배포)
 * - Public 서브넷의 t4g.nano. 로컬에서 RDS 로 SSH 터널을 열 때만 사용
 * - 키페어 개인키는 SSM Parameter Store (/ec2/keypair/{id}) 에 저장됨
 * - SSH 는 cdk.json 의 sshAllowedCidrs 에 적힌 IP 에서만 허용 (전체 개방 금지)
 */
export class Ec2Stack extends BaseStack {
  constructor(scope: Construct, id: string, props: Ec2StackProps) {
    super(scope, id, props);

    const { vpc, sshAllowedCidrs } = props;

    const keyPair = new ec2.KeyPair(this, "BastionKeyPair", {
      keyPairName: `${this.resourcePrefix}-bastion-keypair`,
      type: ec2.KeyPairType.ED25519,
    });

    const bastionSg = new ec2.SecurityGroup(this, "BastionSecurityGroup", {
      vpc,
      securityGroupName: `${this.resourcePrefix}-bastion-sg`,
      description: "Bastion EC2 security group - SSH from allowed CIDRs only",
      allowAllOutbound: true,
    });
    for (const cidr of sshAllowedCidrs) {
      bastionSg.addIngressRule(ec2.Peer.ipv4(cidr), ec2.Port.tcp(22), "SSH access");
    }

    const bastion = new ec2.Instance(this, "BastionInstance", {
      vpc,
      instanceName: `${this.resourcePrefix}-bastion`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.NANO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      keyPair,
      securityGroup: bastionSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      requireImdsv2: true,
    });

    const eip = new ec2.CfnEIP(this, "BastionEip", {
      domain: "vpc",
      instanceId: bastion.instanceId,
    });

    putParameter(this, "SsmBastionIp", this.stage, SSM_KEYS.BASTION_PUBLIC_IP, eip.attrPublicIp);

    new cdk.CfnOutput(this, "BastionPublicIp", {
      value: eip.attrPublicIp,
      description: "~/.ssh/config 의 HostName 에 사용",
    });
    new cdk.CfnOutput(this, "BastionKeyParameter", {
      value: `/ec2/keypair/${keyPair.keyPairId}`,
      description: "개인키 위치: aws ssm get-parameter --with-decryption --name <이 값>",
    });
  }
}
