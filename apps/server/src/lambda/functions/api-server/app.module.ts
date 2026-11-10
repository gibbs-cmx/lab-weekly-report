import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

import { AdminModule } from "./admin/admin.module";
import { AuthModule } from "./auth/auth.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectModule } from "./project/project.module";
import { ReportModule } from "./report/report.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [PrismaModule, AuthModule, UserModule, ProjectModule, ReportModule, AdminModule],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
