import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Roles } from "../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import {
  CreateProjectDto,
  ListProjectsQueryDto,
  UpdateProjectDto,
} from "../project/dto/project.dto";
import { ProjectService } from "../project/project.service";
import { ParticipationQueryDto, WeekQueryDto } from "../report/dto/report.dto";
import { ReportService } from "../report/report.service";
import { UserService } from "../user/user.service";

import { CreateUserDto, ListUsersQueryDto, UpdateUserDto } from "./admin-users.dto";

// ── 프로젝트 ────────────────────────────────────────────────────────────────

@ApiTags("관리자 - 프로젝트")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/projects")
export class AdminProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: "프로젝트 목록" })
  list(@Query() query: ListProjectsQueryDto) {
    return this.projectService.list({ status: query.status });
  }

  @Post()
  @ApiOperation({ summary: "프로젝트 등록" })
  create(@Body() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  @Get(":projectId")
  @ApiOperation({ summary: "프로젝트 상세" })
  get(@Param("projectId", ParseIntPipe) projectId: number) {
    return this.projectService.get(projectId);
  }

  @Post(":projectId/update")
  @ApiOperation({ summary: "프로젝트 수정" })
  update(@Param("projectId", ParseIntPipe) projectId: number, @Body() dto: UpdateProjectDto) {
    return this.projectService.update(projectId, dto);
  }

  @Post(":projectId/delete")
  @ApiOperation({ summary: "프로젝트 삭제 (보고서에 사용된 적 없을 때만)" })
  delete(@Param("projectId", ParseIntPipe) projectId: number) {
    return this.projectService.delete(projectId);
  }
}

// ── 사용자 ──────────────────────────────────────────────────────────────────

@ApiTags("관리자 - 사용자")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/users")
export class AdminUserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiOperation({ summary: "사용자 목록" })
  list(@Query() query: ListUsersQueryDto) {
    return this.userService.list({ includeInactive: query.includeInactive });
  }

  @Post()
  @ApiOperation({ summary: "사용자 등록 (임시 비밀번호 1회 반환)" })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Post(":userId/update")
  @ApiOperation({ summary: "사용자 수정 (권한/소속/활성 여부)" })
  update(@Param("userId", ParseIntPipe) userId: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(userId, dto);
  }

  @Post(":userId/reset-password")
  @ApiOperation({ summary: "비밀번호 초기화 + 잠금 해제 (임시 비밀번호 1회 반환)" })
  resetPassword(@Param("userId", ParseIntPipe) userId: number) {
    return this.userService.resetPassword(userId);
  }
}

// ── 주간보고 ────────────────────────────────────────────────────────────────

@ApiTags("관리자 - 주간보고")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
@Controller("admin/reports")
export class AdminReportController {
  constructor(private reportService: ReportService) {}

  @Get()
  @ApiOperation({ summary: "주간 제출 현황 (?weekStart=)" })
  weekStatus(@Query() query: WeekQueryDto) {
    return this.reportService.getWeekStatus(query.weekStart);
  }

  // 정적 경로는 :reportId 보다 먼저 선언
  @Get("participation")
  @ApiOperation({ summary: "프로젝트별 참여율 집계 (?from=&to=&projectId=)" })
  participation(@Query() query: ParticipationQueryDto) {
    return this.reportService.getParticipation(query.from, query.to, query.projectId);
  }

  @Get("stats")
  @ApiOperation({ summary: "기간 통계 — 주차별 추이, 구성원별 제출/참여 (?from=&to=)" })
  stats(@Query() query: ParticipationQueryDto) {
    return this.reportService.getStats(query.from, query.to);
  }

  @Get("export")
  @ApiOperation({ summary: "내보내기용 원본 행 — 보고서 항목 단위 (?from=&to=)" })
  exportRows(@Query() query: ParticipationQueryDto) {
    return this.reportService.getExportRows(query.from, query.to);
  }

  @Get(":reportId")
  @ApiOperation({ summary: "주간보고 상세" })
  get(@Param("reportId", ParseIntPipe) reportId: number) {
    return this.reportService.getDetailForAdmin(reportId);
  }

  @Post(":reportId/reopen")
  @ApiOperation({ summary: "제출 취소 (재오픈 → 작성자 수정 가능)" })
  reopen(@Param("reportId", ParseIntPipe) reportId: number) {
    return this.reportService.reopen(reportId);
  }
}
