#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";

import { ApiGatewayStack } from "../lib/apigateway-stack";
import { ProjectConfig } from "../lib/base";
import { Ec2Stack } from "../lib/stateful/ec2-stack";
import { RdsStack } from "../lib/stateful/rds-stack";
import { VpcStack } from "../lib/stateful/vpc-stack";

interface StageConfig {
  project: ProjectConfig;
  /** Bastion SSH 허용 IP 대역 (예: ["203.0.113.10/32"]) */
  sshAllowedCidrs?: string[];
  /** CORS 허용 프론트 주소 */
  corsOrigins?: string[];
}

const app = new cdk.App();

const stage: string = app.node.tryGetContext("stage") || "dev";
const stageConfig = (app.node.tryGetContext("env") as Record<string, StageConfig> | undefined)?.[
  stage
];
if (!stageConfig) {
  throw new Error(`cdk.json 의 context.env 에 '${stage}' 설정이 없습니다`);
}
const { project } = stageConfig;

// account 가 비어 있으면 실행하는 AWS 프로필의 계정을 사용
const env: cdk.Environment = {
  account: project.account || process.env.CDK_DEFAULT_ACCOUNT,
  region: project.region,
};
const prefix = `${project.service}-${stage}`;
const base = { stage, project, env };

// ── Stateful 스택 (사람이 수동 배포) ────────────────────────────────────
const vpcStack = new VpcStack(app, `${prefix}-vpc`, base);

const rdsStack = new RdsStack(app, `${prefix}-rds`, { ...base, vpc: vpcStack.vpc });
rdsStack.addStackDependency(vpcStack);

const bastionStack = new Ec2Stack(app, `${prefix}-bastion`, {
  ...base,
  vpc: vpcStack.vpc,
  sshAllowedCidrs: stageConfig.sshAllowedCidrs ?? [],
});
bastionStack.addStackDependency(vpcStack);

// ── Stateless 스택 (SSM 으로 VPC/RDS 참조 — 단독 배포 가능) ─────────────
new ApiGatewayStack(app, `${prefix}-api`, {
  ...base,
  corsOrigins: stageConfig.corsOrigins ?? [],
});
