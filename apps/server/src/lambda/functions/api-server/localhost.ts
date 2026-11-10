import "dotenv/config";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { configureApp } from "./configure-app";
import { resolveRuntimeSecrets } from "./prisma/resolve-runtime-secrets";

const PORT = Number(process.env.PORT) || 4200;

/** 로컬 개발 서버. 배포 환경에서는 main.ts 의 Lambda 핸들러가 같은 앱을 실행한다. */
async function main() {
  await resolveRuntimeSecrets();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(PORT);
  console.log(`Server running on http://localhost:${PORT}/api/v1`);
  console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
}

void main();
