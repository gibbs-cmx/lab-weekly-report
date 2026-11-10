import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { addTags } from "./tag";

export interface ProjectConfig {
  account: string;
  profile: string;
  region: string;
  team: string;
  service: string;
  owner: string;
}

export interface BaseStackProps extends cdk.StackProps {
  stage: string;
  project: ProjectConfig;
}

/**
 * 모든 스택의 기본 클래스
 * - 환경 설정 (stage, account, region)
 * - 리소스 네이밍 prefix
 * - 공통 태깅
 */
export class BaseStack extends cdk.Stack {
  public readonly stage: string;
  public readonly project: ProjectConfig;
  public readonly resourcePrefix: string;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    this.stage = props.stage;
    this.project = props.project;
    this.resourcePrefix = `${props.project.service}-${props.stage}`;

    // 모든 리소스에 공통 태그 추가
    addTags(this, {
      environment: props.stage,
      team: props.project.team,
      service: props.project.service,
      owner: props.project.owner,
    });
  }

  /** PRD 환경 여부 */
  get isProd(): boolean {
    return this.stage === "prd";
  }
}
