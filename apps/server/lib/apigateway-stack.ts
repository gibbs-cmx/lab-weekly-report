import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

import { BaseStack, BaseStackProps, getParameter, putParameter, SSM_KEYS } from "./base";
import { VPC_AZS } from "./stateful/vpc-stack";

export interface ApiGatewayStackProps extends BaseStackProps {
  /** 브라우저에서 API 를 호출할 프론트 주소 (CORS 허용 목록) */
  corsOrigins: string[];
}

/**
 * API 스택 (stateless) — API Gateway → Lambda(NestJS) 하나.
 * - VPC/RDS 스택과 직접 의존 없음: 필요한 값은 SSM Parameter 로 읽는다
 * - Lambda 는 VPC 의 Lambda 서브넷에 배치 (RDS 접근 + NAT 로 Secrets Manager 접근)
 * - DB 접속 정보와 JWT 시크릿은 환경변수에 평문으로 넣지 않고, 실행 시 Secrets Manager 에서 읽는다
 */
export class ApiGatewayStack extends BaseStack {
  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // ── SSM 에서 VPC/RDS 정보 조회 ─────────────────────────────────────
    const vpc = ec2.Vpc.fromVpcAttributes(this, "ImportedVpc", {
      vpcId: getParameter(this, this.stage, SSM_KEYS.VPC_ID),
      availabilityZones: VPC_AZS,
      privateSubnetIds: [
        getParameter(this, this.stage, SSM_KEYS.LAMBDA_SUBNET_ID_1),
        getParameter(this, this.stage, SSM_KEYS.LAMBDA_SUBNET_ID_2),
      ],
    });
    const dbSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      "ImportedDbSecret",
      getParameter(this, this.stage, SSM_KEYS.RDS_SECRET_ARN),
    );

    // JWT 서명 키 — 자동 생성. 스택을 지웠다 다시 만들면 기존 로그인 토큰은 무효가 된다
    const jwtSecret = new secretsmanager.Secret(this, "JwtSecret", {
      secretName: `${this.resourcePrefix}/jwt-secret`,
      description: "JWT signing secret",
      generateSecretString: { passwordLength: 64, excludePunctuation: true },
    });

    const lambdaSg = new ec2.SecurityGroup(this, "LambdaSecurityGroup", {
      vpc,
      securityGroupName: `${this.resourcePrefix}-lambda-sg`,
      description: "API Lambda security group",
      allowAllOutbound: true,
    });

    const apiFunction = new lambda.Function(this, "ApiFunction", {
      functionName: `${this.resourcePrefix}-api`,
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.X86_64, // Prisma 엔진 binaryTargets(rhel-openssl-3.0.x)와 일치
      handler: "bundle.handler",
      code: lambda.Code.fromAsset("./dist"),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(29),
      vpc,
      vpcSubnets: { subnets: vpc.privateSubnets },
      securityGroups: [lambdaSg],
      logGroup: new logs.LogGroup(this, "ApiLogGroup", {
        logGroupName: `/aws/lambda/${this.resourcePrefix}-api`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      environment: {
        NODE_ENV: "production",
        STAGE_NAME: this.stage,
        RDS_SECRET_ARN: dbSecret.secretArn,
        RDS_ENDPOINT: getParameter(this, this.stage, SSM_KEYS.RDS_ENDPOINT),
        RDS_DB_NAME: getParameter(this, this.stage, SSM_KEYS.RDS_DB_NAME),
        JWT_SECRET_ARN: jwtSecret.secretArn,
        CORS_ORIGINS: props.corsOrigins.join(","),
      },
    });
    dbSecret.grantRead(apiFunction);
    jwtSecret.grantRead(apiFunction);

    // ── API Gateway: 모든 요청을 Lambda 로 프록시 ──────────────────────
    const api = new apigateway.LambdaRestApi(this, "RestApi", {
      restApiName: `${this.resourcePrefix}-api`,
      description: "주간보고 시스템 API",
      handler: apiFunction,
      proxy: true,
      deployOptions: { stageName: this.stage },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    putParameter(this, "SsmApiUrl", this.stage, SSM_KEYS.API_URL, api.url);

    new cdk.CfnOutput(this, "ApiUrl", {
      value: `${api.url}api/v1`,
      description: "프론트의 NEXT_PUBLIC_API_URL 에 사용",
    });
    new cdk.CfnOutput(this, "SwaggerUrl", { value: `${api.url}api/docs`, description: "API 문서" });
    new cdk.CfnOutput(this, "FunctionName", {
      value: apiFunction.functionName,
      description: "Lambda 이름",
    });
  }
}
