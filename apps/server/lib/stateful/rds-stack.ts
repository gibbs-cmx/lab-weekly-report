import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

import { BaseStack, BaseStackProps, putParameter, SSM_KEYS } from "../base";

/** 환경별 인스턴스 (T4G = Graviton). 구성원 50명 규모는 micro 로 충분 */
const INSTANCE_CLASS: Record<string, ec2.InstanceType> = {
  dev: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
  prd: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
};

const DB_NAME = "weekly_report";
const DB_USERNAME = "wr_admin";
const ENGINE = rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 });

export interface RdsStackProps extends BaseStackProps {
  vpc: ec2.IVpc;
}

/**
 * RDS PostgreSQL 스택 (stateful — 사람이 수동 배포)
 * - PostgreSQL 16 단일 인스턴스, Database(격리) 서브넷
 * - 접속 허용: Lambda 서브넷 + Public 서브넷(Bastion) 의 5432
 * - 자격증명은 Secrets Manager 자동 생성
 * - 삭제해도 데이터가 남도록 최종 스냅샷 생성 (prd 는 인스턴스 자체를 유지 + 삭제 보호)
 */
export class RdsStack extends BaseStack {
  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc,
      securityGroupName: `${this.resourcePrefix}-rds-sg`,
      description: "RDS PostgreSQL security group",
      allowAllOutbound: false,
    });
    for (const subnet of vpc.privateSubnets) {
      dbSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.tcp(5432),
        "PostgreSQL from Lambda subnets",
      );
    }
    for (const subnet of vpc.publicSubnets) {
      dbSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.tcp(5432),
        "PostgreSQL from Bastion subnets",
      );
    }

    const parameterGroup = new rds.ParameterGroup(this, "DbParameterGroup", {
      engine: ENGINE,
      parameters: { timezone: "Asia/Seoul", client_encoding: "UTF8" },
    });

    const dbInstance = new rds.DatabaseInstance(this, "PostgresInstance", {
      instanceIdentifier: `${this.resourcePrefix}-postgres`,
      engine: ENGINE,
      instanceType: INSTANCE_CLASS[this.stage] || INSTANCE_CLASS.dev,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      databaseName: DB_NAME,
      credentials: rds.Credentials.fromGeneratedSecret(DB_USERNAME, {
        secretName: `${this.resourcePrefix}/rds-credentials`,
      }),
      parameterGroup,
      multiAz: false,
      storageType: rds.StorageType.GP3,
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(this.isProd ? 35 : 7),
      deletionProtection: this.isProd,
      removalPolicy: this.isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.SNAPSHOT,
    });

    const dbSecret = dbInstance.secret;
    if (!dbSecret) throw new Error("RDS 자격증명 시크릿이 생성되지 않았습니다");

    putParameter(
      this,
      "SsmRdsEndpoint",
      this.stage,
      SSM_KEYS.RDS_ENDPOINT,
      dbInstance.instanceEndpoint.hostname,
    );
    putParameter(this, "SsmRdsSecretArn", this.stage, SSM_KEYS.RDS_SECRET_ARN, dbSecret.secretArn);
    putParameter(this, "SsmRdsDbName", this.stage, SSM_KEYS.RDS_DB_NAME, DB_NAME);

    new cdk.CfnOutput(this, "RdsEndpoint", {
      value: dbInstance.instanceEndpoint.hostname,
      description: ".env.dev 의 RDS_ENDPOINT, scripts/tunnel-rds.sh 에 사용",
    });
    new cdk.CfnOutput(this, "RdsSecretName", {
      value: dbSecret.secretName,
      description: ".env.dev 의 RDS_SECRET_ARN 에 사용 (이름으로도 조회 가능)",
    });
  }
}
