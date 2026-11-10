import { Module } from "@nestjs/common";

import { ProjectModule } from "../project/project.module";
import { ReportModule } from "../report/report.module";
import { UserModule } from "../user/user.module";

import {
  AdminProjectController,
  AdminReportController,
  AdminUserController,
} from "./admin.controllers";

@Module({
  imports: [ProjectModule, UserModule, ReportModule],
  controllers: [AdminProjectController, AdminUserController, AdminReportController],
})
export class AdminModule {}
