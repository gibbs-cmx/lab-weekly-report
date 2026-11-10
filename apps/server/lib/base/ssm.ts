import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

/**
 * SSM Parameter Store 유틸리티 — 스택 간 값을 주고받는 통로.
 * 경로: /weekly-report/{stage}/{key}
 *
 * API 스택은 VPC/RDS 스택을 직접 참조하지 않고 여기서 값을 읽는다 (배포 시점에 CloudFormation 이 해석).
 * → API 스택만 따로 배포해도 stateful 스택을 건드리지 않고, synth 에 AWS 자격증명이 필요 없다.
 */
export const SSM_PREFIX = "/weekly-report";

export const SSM_KEYS = {
  VPC_ID: "VPC_ID",
  LAMBDA_SUBNET_ID_1: "LAMBDA_SUBNET_ID_1",
  LAMBDA_SUBNET_ID_2: "LAMBDA_SUBNET_ID_2",
  RDS_ENDPOINT: "RDS_ENDPOINT",
  RDS_SECRET_ARN: "RDS_SECRET_ARN",
  RDS_DB_NAME: "RDS_DB_NAME",
  BASTION_PUBLIC_IP: "BASTION_PUBLIC_IP",
  API_URL: "API_URL",
} as const;

export type SsmKey = (typeof SSM_KEYS)[keyof typeof SSM_KEYS];

function parameterName(stage: string, key: SsmKey): string {
  return `${SSM_PREFIX}/${stage}/${key}`;
}

/** SSM 파라미터 저장 */
export function putParameter(
  scope: Construct,
  id: string,
  stage: string,
  key: SsmKey,
  value: string,
): ssm.StringParameter {
  return new ssm.StringParameter(scope, id, {
    parameterName: parameterName(stage, key),
    stringValue: value,
    description: `[${stage}] ${key}`,
  });
}

/** SSM 파라미터 조회 — 배포 시점에 해석되는 토큰 */
export function getParameter(scope: Construct, stage: string, key: SsmKey): string {
  return ssm.StringParameter.valueForStringParameter(scope, parameterName(stage, key));
}
