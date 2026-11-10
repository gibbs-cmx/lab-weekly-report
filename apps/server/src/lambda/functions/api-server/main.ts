import { NestFactory } from "@nestjs/core";
import { configure as serverlessExpress } from "@vendia/serverless-express";
import type { Callback, Context, Handler } from "aws-lambda";

import { AppModule } from "./app.module";
import { configureApp } from "./configure-app";
import { resolveRuntimeSecrets } from "./prisma/resolve-runtime-secrets";

let cachedHandler: Handler | undefined;

/** 콜드 스타트 때 한 번만 Nest 앱을 만들고, 이후 호출은 재사용 */
async function bootstrap(): Promise<Handler> {
  await resolveRuntimeSecrets();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.init();
  return serverlessExpress({ app: app.getHttpAdapter().getInstance() });
}

/** Lambda 핸들러 — API Gateway 프록시 이벤트를 NestJS(express)로 전달 */
export const handler = async (event: unknown, context: Context, callback: Callback) => {
  cachedHandler ??= await bootstrap();
  return cachedHandler(event, context, callback);
};
