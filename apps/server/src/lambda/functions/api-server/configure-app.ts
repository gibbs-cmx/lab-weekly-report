import { INestApplication, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

const LOCAL_ORIGINS = ["http://localhost:3200", "http://localhost:3201"]; // web, admin

/** Lambda(main.ts)와 로컬(localhost.ts)이 공유하는 앱 설정 — CORS, 검증, prefix, Swagger */
export function configureApp(app: INestApplication): void {
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",").filter(Boolean) || LOCAL_ORIGINS,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.setGlobalPrefix("api/v1");

  const config = new DocumentBuilder()
    .setTitle("Weekly Report API")
    .setDescription("연구소 주간보고 시스템 API")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("사용자 - 인증")
    .addTag("사용자 - 내 정보")
    .addTag("사용자 - 프로젝트")
    .addTag("사용자 - 주간보고")
    .addTag("관리자 - 프로젝트")
    .addTag("관리자 - 사용자")
    .addTag("관리자 - 주간보고")
    .build();
  // Lambda 번들에는 swagger-ui 정적 파일이 없으므로 CDN 에서 로드
  SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config), {
    customCssUrl: "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    customJs: [
      "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
      "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js",
    ],
  });
}
