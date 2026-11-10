import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

import { ProjectService } from "./project.service";

@ApiTags("사용자 - 프로젝트")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projects")
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: "선택 가능한 프로젝트 목록 (ACTIVE)" })
  listActive() {
    return this.projectService.list({ status: "ACTIVE" });
  }
}
