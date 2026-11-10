import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface TagOptions {
  environment: string;
  team: string;
  service: string;
  owner: string;
}

/**
 * 모든 리소스에 표준 태그 추가
 */
export function addTags(scope: Construct, options: TagOptions): void {
  cdk.Tags.of(scope).add("Environment", options.environment);
  cdk.Tags.of(scope).add("Team", options.team);
  cdk.Tags.of(scope).add("Service", options.service);
  cdk.Tags.of(scope).add("Owner", options.owner);
  cdk.Tags.of(scope).add("ManagedBy", "cdk");
}
