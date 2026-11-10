import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { WeeklyReport } from "@prisma/client";
import {
  addDays,
  currentWeekStart,
  formatDate,
  getWeekStart,
  isWeekStart,
  listWeekStarts,
  parseDate,
  sumParticipation,
  todayKst,
  validateReportItems,
} from "@wr/shared";

import { PrismaService } from "../prisma/prisma.service";
import { toUserResponse } from "../user/user.mapper";

import type { SaveReportDto } from "./dto/report.dto";
import { aggregateParticipation } from "./participation";
import { buildStats } from "./stats";

/** 기본 조회 기간 (주) — from/to 미지정 시 최근 12주 */
const DEFAULT_RANGE_WEEKS = 12;

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  // ── 공통 ───────────────────────────────────────────────────────────────

  private assertWeekStart(weekStart: string) {
    if (!isWeekStart(weekStart)) {
      throw new BadRequestException("weekStart 는 월요일 날짜(YYYY-MM-DD)여야 합니다");
    }
  }

  private resolveRange(from?: string, to?: string) {
    const end = getWeekStart(to ?? currentWeekStart());
    const start = getWeekStart(from ?? addDays(end, -7 * (DEFAULT_RANGE_WEEKS - 1)));
    if (start > end) throw new BadRequestException("시작일이 종료일보다 늦습니다");
    return { start, end };
  }

  /** 보고서 + 항목(프로젝트 정보 포함) 응답 조립 */
  private async buildDetail(report: WeeklyReport) {
    const items = await this.prisma.weeklyReportItem.findMany({
      where: { reportId: report.id },
      orderBy: { sortOrder: "asc" },
    });
    const projects = await this.prisma.project.findMany({
      where: { id: { in: items.map((i) => i.projectId) } },
    });
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    return {
      id: report.id,
      userId: report.userId,
      weekStart: formatDate(report.weekStart),
      status: report.status,
      note: report.note,
      submittedAt: report.submittedAt,
      updatedAt: report.updatedAt,
      totalRate: sumParticipation(items),
      items: items.map((i) => ({
        id: i.id,
        projectId: i.projectId,
        projectCode: projectMap.get(i.projectId)?.code ?? "",
        projectName: projectMap.get(i.projectId)?.name ?? "(삭제된 프로젝트)",
        participationRate: i.participationRate,
        doneText: i.doneText,
        planText: i.planText,
      })),
    };
  }

  // ── 사용자 ─────────────────────────────────────────────────────────────

  /** 특정 주 내 보고서 (없으면 null) */
  async getMyWeek(userId: number, weekStart: string) {
    this.assertWeekStart(weekStart);
    const report = await this.prisma.weeklyReport.findUnique({
      where: { userId_weekStart: { userId, weekStart: parseDate(weekStart) } },
    });
    return report ? this.buildDetail(report) : null;
  }

  /** 내 보고서 목록 (기간) — 요약 */
  async listMine(userId: number, from?: string, to?: string) {
    const { start, end } = this.resolveRange(from, to);
    const reports = await this.prisma.weeklyReport.findMany({
      where: { userId, weekStart: { gte: parseDate(start), lte: parseDate(end) } },
      orderBy: { weekStart: "desc" },
    });
    const items = await this.prisma.weeklyReportItem.findMany({
      where: { reportId: { in: reports.map((r) => r.id) } },
    });
    const projects = await this.prisma.project.findMany({
      where: { id: { in: [...new Set(items.map((i) => i.projectId))] } },
    });
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    return reports.map((r) => {
      const mine = items
        .filter((i) => i.reportId === r.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      return {
        id: r.id,
        weekStart: formatDate(r.weekStart),
        status: r.status,
        submittedAt: r.submittedAt,
        itemCount: mine.length,
        totalRate: sumParticipation(mine),
        items: mine.map((i) => ({
          projectId: i.projectId,
          projectName: projectMap.get(i.projectId)?.name ?? "(삭제된 프로젝트)",
          participationRate: i.participationRate,
        })),
      };
    });
  }

  /** 내 통계 — 제출률, 프로젝트별 평균 참여율, 미제출 주 */
  async getMyStats(userId: number, from?: string, to?: string) {
    const { start, end } = this.resolveRange(from, to);
    const weeks = listWeekStarts(start, end);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("사용자를 찾을 수 없습니다");

    const reports = await this.prisma.weeklyReport.findMany({
      where: { userId, weekStart: { gte: parseDate(start), lte: parseDate(end) } },
    });
    const items = await this.prisma.weeklyReportItem.findMany({
      where: { reportId: { in: reports.map((r) => r.id) } },
    });
    const stats = buildStats({
      weeks,
      members: [{ userId, joinedWeek: getWeekStart(todayKst(user.createdAt)) }],
      reports: reports.map((r) => ({
        id: r.id,
        userId: r.userId,
        weekStart: formatDate(r.weekStart),
        status: r.status,
      })),
      items,
    });
    const member = stats.members[0];
    const projects = await this.prisma.project.findMany({
      where: { id: { in: member.byProject.map((p) => p.projectId) } },
    });
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    return {
      from: start,
      to: end,
      totalWeeks: weeks.length,
      expectedWeeks: member.expectedWeeks,
      submittedWeeks: member.submittedWeeks,
      submitRate: member.submitRate,
      unsubmittedWeeks: member.unsubmittedWeeks,
      byProject: member.byProject
        .map((p) => ({
          ...p,
          projectCode: projectMap.get(p.projectId)?.code ?? "",
          projectName: projectMap.get(p.projectId)?.name ?? "(삭제된 프로젝트)",
        }))
        .sort((a, b) => b.avgRate - a.avgRate),
    };
  }

  /**
   * 저장 (임시저장/제출 공통). 해당 주 보고서가 없으면 생성, 있으면 항목 전체 교체.
   * 제출된 보고서는 "다시 제출"로만 수정 가능 (상태 SUBMITTED 유지, 최초 제출 시각 유지).
   */
  async save(userId: number, dto: SaveReportDto, submit: boolean) {
    this.assertWeekStart(dto.weekStart);
    if (dto.weekStart > currentWeekStart()) {
      throw new BadRequestException("미래 주차의 보고서는 작성할 수 없습니다");
    }

    const errors = validateReportItems(dto.items, { forSubmit: submit });
    if (errors.length > 0) throw new BadRequestException(errors.join("\n"));

    const projectIds = dto.items.map((i) => i.projectId);
    const activeCount = await this.prisma.project.count({
      where: { id: { in: projectIds }, status: "ACTIVE" },
    });
    if (activeCount !== projectIds.length) {
      throw new BadRequestException("선택할 수 없는 프로젝트가 포함되어 있습니다 (종료/삭제됨)");
    }

    const weekStart = parseDate(dto.weekStart);
    const existing = await this.prisma.weeklyReport.findUnique({
      where: { userId_weekStart: { userId, weekStart } },
    });
    // 제출된 보고서도 본인이 수정할 수 있다. 단 "다시 제출"만 허용 — 임시저장으로 제출을 취소하지는 못함
    if (existing?.status === "SUBMITTED" && !submit) {
      throw new BadRequestException(
        "이미 제출된 보고서는 임시저장할 수 없습니다. 수정한 뒤 다시 제출해주세요.",
      );
    }
    // 최초 제출 시각은 유지 (수정 시각은 updatedAt)
    const submittedAt = submit ? (existing?.submittedAt ?? new Date()) : null;

    const report = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.weeklyReport.upsert({
        where: { userId_weekStart: { userId, weekStart } },
        create: {
          userId,
          weekStart,
          note: dto.note?.trim() ?? "",
          status: submit ? "SUBMITTED" : "DRAFT",
          submittedAt,
        },
        update: {
          note: dto.note?.trim() ?? "",
          status: submit ? "SUBMITTED" : "DRAFT",
          submittedAt,
        },
      });
      await tx.weeklyReportItem.deleteMany({ where: { reportId: saved.id } });
      await tx.weeklyReportItem.createMany({
        data: dto.items.map((it, idx) => ({
          reportId: saved.id,
          projectId: it.projectId,
          participationRate: it.participationRate,
          doneText: it.doneText.trim(),
          planText: it.planText?.trim() ?? "",
          sortOrder: idx,
        })),
      });
      return saved;
    });

    return this.buildDetail(report);
  }

  // ── 관리자 ─────────────────────────────────────────────────────────────

  /** 주간 제출 현황 — 활성 사용자 전원 + 해당 주 보고서 상태 */
  async getWeekStatus(weekStart: string) {
    this.assertWeekStart(weekStart);
    const users = await this.prisma.user.findMany({
      where: { isActive: true, role: "MEMBER" },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });
    const reports = await this.prisma.weeklyReport.findMany({
      where: { weekStart: parseDate(weekStart) },
    });
    const items = await this.prisma.weeklyReportItem.findMany({
      where: { reportId: { in: reports.map((r) => r.id) } },
    });
    const projects = await this.prisma.project.findMany({
      where: { id: { in: [...new Set(items.map((i) => i.projectId))] } },
    });
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const reportByUser = new Map(reports.map((r) => [r.userId, r]));

    const rows = users.map((u) => {
      const r = reportByUser.get(u.id);
      const mine = r
        ? items.filter((i) => i.reportId === r.id).sort((a, b) => a.sortOrder - b.sortOrder)
        : [];
      return {
        user: toUserResponse(u),
        reportId: r?.id ?? null,
        status: r?.status ?? ("NONE" as const),
        submittedAt: r?.submittedAt ?? null,
        itemCount: mine.length,
        totalRate: sumParticipation(mine),
        items: mine.map((i) => ({
          projectId: i.projectId,
          projectName: projectMap.get(i.projectId)?.name ?? "(삭제된 프로젝트)",
          participationRate: i.participationRate,
        })),
      };
    });

    return {
      weekStart,
      summary: {
        total: rows.length,
        submitted: rows.filter((r) => r.status === "SUBMITTED").length,
        draft: rows.filter((r) => r.status === "DRAFT").length,
        none: rows.filter((r) => r.status === "NONE").length,
      },
      rows,
    };
  }

  async getDetailForAdmin(reportId: number) {
    const report = await this.prisma.weeklyReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException("보고서를 찾을 수 없습니다");
    const user = await this.prisma.user.findUnique({ where: { id: report.userId } });
    return { ...(await this.buildDetail(report)), user: user ? toUserResponse(user) : null };
  }

  /** 제출 취소(재오픈) — 작성자가 다시 수정할 수 있도록 DRAFT 로 되돌림 */
  async reopen(reportId: number) {
    const report = await this.prisma.weeklyReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException("보고서를 찾을 수 없습니다");
    if (report.status !== "SUBMITTED")
      throw new BadRequestException("제출된 보고서만 재오픈할 수 있습니다");
    const updated = await this.prisma.weeklyReport.update({
      where: { id: reportId },
      data: { status: "DRAFT", submittedAt: null },
    });
    return this.buildDetail(updated);
  }

  /** 프로젝트별 참여율 집계 (제출된 보고서만) */
  async getParticipation(from: string, to: string, projectId?: number) {
    const { start, end } = this.resolveRange(from, to);
    const weeks = listWeekStarts(start, end);

    const reports = await this.prisma.weeklyReport.findMany({
      where: { status: "SUBMITTED", weekStart: { gte: parseDate(start), lte: parseDate(end) } },
    });
    const reportMap = new Map(reports.map((r) => [r.id, r]));
    const items = await this.prisma.weeklyReportItem.findMany({
      where: { reportId: { in: reports.map((r) => r.id) }, ...(projectId ? { projectId } : {}) },
    });

    const rows = items.flatMap((i) => {
      const r = reportMap.get(i.reportId);
      return r
        ? [
            {
              projectId: i.projectId,
              userId: r.userId,
              weekStart: formatDate(r.weekStart),
              participationRate: i.participationRate,
            },
          ]
        : [];
    });
    const aggregated = aggregateParticipation(rows, weeks.length);

    const [projects, users] = await Promise.all([
      this.prisma.project.findMany({ where: { id: { in: aggregated.map((a) => a.projectId) } } }),
      this.prisma.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.userId))] } } }),
    ]);
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      from: start,
      to: end,
      totalWeeks: weeks.length,
      submittedReports: reports.length,
      projects: aggregated.map((a) => ({
        ...a,
        projectCode: projectMap.get(a.projectId)?.code ?? "",
        projectName: projectMap.get(a.projectId)?.name ?? "(삭제된 프로젝트)",
        members: a.members.map((m) => ({
          ...m,
          name: userMap.get(m.userId)?.name ?? "",
          department: userMap.get(m.userId)?.department ?? "",
        })),
      })),
    };
  }

  /** 기간 통계 — 주차별 추이 + 구성원별 제출/참여 현황 */
  async getStats(from: string, to: string) {
    const { start, end } = this.resolveRange(from, to);
    const weeks = listWeekStarts(start, end);

    const users = await this.prisma.user.findMany({
      where: { isActive: true, role: "MEMBER" },
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });
    const reports = await this.prisma.weeklyReport.findMany({
      where: {
        userId: { in: users.map((u) => u.id) },
        weekStart: { gte: parseDate(start), lte: parseDate(end) },
      },
    });
    const items = await this.prisma.weeklyReportItem.findMany({
      where: { reportId: { in: reports.map((r) => r.id) } },
    });

    const stats = buildStats({
      weeks,
      members: users.map((u) => ({
        userId: u.id,
        joinedWeek: getWeekStart(todayKst(u.createdAt)),
      })),
      reports: reports.map((r) => ({
        id: r.id,
        userId: r.userId,
        weekStart: formatDate(r.weekStart),
        status: r.status,
      })),
      items,
    });

    const projectIds = [
      ...new Set(stats.weeks.flatMap((w) => w.byProject.map((p) => p.projectId))),
    ];
    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      from: start,
      to: end,
      totalWeeks: weeks.length,
      projects: projects.map((p) => ({
        projectId: p.id,
        projectCode: p.code,
        projectName: p.name,
      })),
      weeks: stats.weeks,
      months: stats.months,
      members: stats.members.map((m) => ({
        ...m,
        name: userMap.get(m.userId)?.name ?? "",
        department: userMap.get(m.userId)?.department ?? "",
        position: userMap.get(m.userId)?.position ?? "",
      })),
    };
  }

  /** 내보내기용 원본 행 — 기간 내 모든 보고서를 항목(프로젝트) 단위로 펼친다 */
  async getExportRows(from: string, to: string) {
    const { start, end } = this.resolveRange(from, to);
    const reports = await this.prisma.weeklyReport.findMany({
      where: { weekStart: { gte: parseDate(start), lte: parseDate(end) } },
    });
    const [items, users] = await Promise.all([
      this.prisma.weeklyReportItem.findMany({
        where: { reportId: { in: reports.map((r) => r.id) } },
        orderBy: { sortOrder: "asc" },
      }),
      this.prisma.user.findMany({
        where: { id: { in: [...new Set(reports.map((r) => r.userId))] } },
      }),
    ]);
    const projects = await this.prisma.project.findMany({
      where: { id: { in: [...new Set(items.map((i) => i.projectId))] } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const rows = reports.flatMap((r) => {
      const u = userMap.get(r.userId);
      const base = {
        weekStart: formatDate(r.weekStart),
        name: u?.name ?? "",
        department: u?.department ?? "",
        position: u?.position ?? "",
        status: r.status,
        submittedAt: r.submittedAt,
        note: r.note,
      };
      const mine = items.filter((i) => i.reportId === r.id);
      if (mine.length === 0) {
        return [
          {
            ...base,
            projectCode: "",
            projectName: "",
            participationRate: null,
            doneText: "",
            planText: "",
          },
        ];
      }
      return mine.map((i) => ({
        ...base,
        projectCode: projectMap.get(i.projectId)?.code ?? "",
        projectName: projectMap.get(i.projectId)?.name ?? "(삭제된 프로젝트)",
        participationRate: i.participationRate as number | null,
        doneText: i.doneText,
        planText: i.planText,
      }));
    });
    rows.sort(
      (a, b) =>
        a.weekStart.localeCompare(b.weekStart) ||
        a.department.localeCompare(b.department) ||
        a.name.localeCompare(b.name),
    );
    return { from: start, to: end, rows };
  }
}
