import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

import { BaseStack, BaseStackProps, putParameter, SSM_KEYS } from "../base";

/** 환경별 VPC CIDR */
const VPC_CIDR: Record<string, string> = {
  dev: "10.110.0.0/16",
  prd: "10.210.0.0/16",
};

export const VPC_AZS = ["ap-northeast-2a", "ap-northeast-2c"];

/**
 * VPC 스택 (stateful — 사람이 수동 배포)
 * - Public / Lambda(NAT 경유) / Database(격리) 3-tier, 2 AZ
 * - NAT Gateway 1개 (Lambda → Secrets Manager 등 외부 통신)
 * - Database 서브넷 NACL: VPC 내부의 PostgreSQL 5432 만 허용
 * - S3 Gateway Endpoint, VPC Flow Logs
 */
export class VpcStack extends BaseStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const cidr = VPC_CIDR[this.stage] || VPC_CIDR.dev;

    this.vpc = new ec2.Vpc(this, "Vpc", {
      vpcName: `${this.resourcePrefix}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr(cidr),
      availabilityZones: VPC_AZS,
      natGateways: 1,
      subnetConfiguration: [
        { name: "Public", subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: "Lambda", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: "Database", subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // Database 서브넷 NACL
    const dbNacl = new ec2.NetworkAcl(this, "DatabaseNacl", {
      vpc: this.vpc,
      networkAclName: `${this.resourcePrefix}-db-nacl`,
    });
    this.vpc.isolatedSubnets.forEach((subnet, i) => {
      new ec2.SubnetNetworkAclAssociation(this, `DbNaclAssoc${i + 1}`, {
        subnet,
        networkAcl: dbNacl,
      });
    });
    dbNacl.addEntry("InboundPostgres", {
      ruleNumber: 100,
      cidr: ec2.AclCidr.ipv4(cidr),
      traffic: ec2.AclTraffic.tcpPort(5432),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });
    dbNacl.addEntry("OutboundEphemeral", {
      ruleNumber: 100,
      cidr: ec2.AclCidr.ipv4(cidr),
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    this.vpc.addGatewayEndpoint("S3Endpoint", { service: ec2.GatewayVpcEndpointAwsService.S3 });

    const flowLogGroup = new logs.LogGroup(this, "VpcFlowLogGroup", {
      logGroupName: `/aws/vpc/${this.resourcePrefix}-flow-logs`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: this.isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });
    this.vpc.addFlowLog("FlowLog", {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.REJECT,
    });

    // API 스택이 읽을 값
    putParameter(this, "SsmVpcId", this.stage, SSM_KEYS.VPC_ID, this.vpc.vpcId);
    const lambdaSubnets = this.vpc.privateSubnets;
    putParameter(
      this,
      "SsmLambdaSubnet1",
      this.stage,
      SSM_KEYS.LAMBDA_SUBNET_ID_1,
      lambdaSubnets[0].subnetId,
    );
    putParameter(
      this,
      "SsmLambdaSubnet2",
      this.stage,
      SSM_KEYS.LAMBDA_SUBNET_ID_2,
      lambdaSubnets[1].subnetId,
    );

    new cdk.CfnOutput(this, "VpcId", { value: this.vpc.vpcId, description: "VPC ID" });
  }
}
