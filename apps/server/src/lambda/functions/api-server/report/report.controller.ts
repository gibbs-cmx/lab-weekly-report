import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "../common/auth-user";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

import { RangeQueryDto, SaveReportDto, WeekQueryDto } from "./dto/report.dto";
import { ReportService } from "./report.service";

@ApiTags("사용자 - 주간보고")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Get()
  @ApiOperation({ summary: "내 주간보고 목록 (기본: 최근 12주)" })
  listMine(@CurrentUser() user: AuthUser, @Query() query: RangeQueryDto) {
    return this.reportService.listMine(user.id, query.from, query.to);
  }

  @Get("stats")
  @ApiOperation({ summary: "내 통계 — 제출률, 프로젝트별 평균 참여율 (기본: 최근 12주)" })
  myStats(@CurrentUser() user: AuthUser, @Query() query: RangeQueryDto) {
    return this.reportService.getMyStats(user.id, query.from, query.to);
  }

  @Get("week")
  @ApiOperation({ summary: "특정 주 내 주간보고 (없으면 null)" })
  getMyWeek(@CurrentUser() user: AuthUser, @Query() query: WeekQueryDto) {
    return this.reportService.getMyWeek(user.id, query.weekStart);
  }

  @Post()
  @ApiOperation({ summary: "임시저장 (해당 주 보고서 생성/전체 교체)" })
  saveDraft(@CurrentUser() user: AuthUser, @Body() dto: SaveReportDto) {
    return this.reportService.save(user.id, dto, false);
  }

  @Post("submit")
  @ApiOperation({ summary: "제출 (저장 + 제출, 참여율 합계 100% 필수)" })
  submit(@CurrentUser() user: AuthUser, @Body() dto: SaveReportDto) {
    return this.reportService.save(user.id, dto, true);
  }
}
