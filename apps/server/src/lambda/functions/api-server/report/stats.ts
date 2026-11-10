/**
 * 기간 통계 집계 — 순수 함수 (NestJS/Prisma import 금지).
 *
 * - 제출 대상: 구성원이 등록된 주(joinedWeek) 이후의 모든 주 + 그 전이라도 보고서가 있는 주
 * - 참여율/인·주: 제출(SUBMITTED)된 보고서만 반영
 * - 구성원의 프로젝트별 평균 참여율: Σ참여율 / 제출한 주 수 → 한 구성원의 합이 100% 가 된다
 * - 월별: 한 주는 그 주의 목요일이 속한 달로 센다 (주가 두 달에 걸쳐도 한 달에만 포함)
 */
import { addDays } from "@wr/shared";

export interface StatsMember {
  userId: number;
  /** 등록된 주의 월요일 (YYYY-MM-DD) */
  joinedWeek: string;
}

export interface StatsReport {
  id: number;
  userId: number;
  weekStart: string;
  status: "DRAFT" | "SUBMITTED";
}

export interface StatsItem {
  reportId: number;
  projectId: number;
  participationRate: number;
}

export interface WeekStat {
  weekStart: string;
  expected: number;
  submitted: number;
  draft: number;
  missing: number;
  /** 제출률 (%) — 대상자가 없으면 null */
  submitRate: number | null;
  byProject: { projectId: number; personWeeks: number }[];
}

export interface MemberStat {
  userId: number;
  expectedWeeks: number;
  submittedWeeks: number;
  draftWeeks: number;
  missingWeeks: number;
  submitRate: number | null;
  /** 미제출(미작성+작성중) 주 목록 — 최근 순 */
  unsubmittedWeeks: string[];
  byProject: { projectId: number; personWeeks: number; avgRate: number }[];
}

export interface MonthStat {
  /** YYYY-MM */
  month: string;
  /** 이 달에 속한 주 수 (조회 기간 내) */
  weeks: number;
  members: {
    userId: number;
    expectedWeeks: number;
    submittedWeeks: number;
    /** 프로젝트별 월 평균 참여율(제출한 주 평균)과 인·주 */
    byProject: { projectId: number; avgRate: number; personWeeks: number }[];
  }[];
}

/** 주(월요일) → 그 주가 속한 달 (목요일 기준) */
export function monthOfWeek(weekStart: string): string {
  return addDays(weekStart, 3).slice(0, 7);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function rate(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

export function buildStats(input: {
  weeks: string[];
  members: StatsMember[];
  reports: StatsReport[];
  items: StatsItem[];
}): { weeks: WeekStat[]; members: MemberStat[]; months: MonthStat[] } {
  const { weeks, members, reports, items } = input;
  const memberIds = new Set(members.map((m) => m.userId));
  const weekSet = new Set(weeks);

  // userId → weekStart → report (대상 구성원 + 기간 내 보고서만)
  const reportOf = new Map<number, Map<string, StatsReport>>();
  for (const r of reports) {
    if (!memberIds.has(r.userId) || !weekSet.has(r.weekStart)) continue;
    let m = reportOf.get(r.userId);
    if (!m) reportOf.set(r.userId, (m = new Map()));
    m.set(r.weekStart, r);
  }
  const itemsOf = new Map<number, StatsItem[]>();
  for (const it of items) {
    const list = itemsOf.get(it.reportId);
    if (list) list.push(it);
    else itemsOf.set(it.reportId, [it]);
  }

  const isExpected = (m: StatsMember, week: string) =>
    week >= m.joinedWeek || reportOf.get(m.userId)?.has(week) === true;

  const weekStats: WeekStat[] = weeks.map((week) => {
    let expected = 0;
    let submitted = 0;
    let draft = 0;
    const byProject = new Map<number, number>();
    for (const m of members) {
      if (!isExpected(m, week)) continue;
      expected++;
      const r = reportOf.get(m.userId)?.get(week);
      if (r?.status === "SUBMITTED") {
        submitted++;
        for (const it of itemsOf.get(r.id) ?? []) {
          byProject.set(it.projectId, (byProject.get(it.projectId) ?? 0) + it.participationRate);
        }
      } else if (r) {
        draft++;
      }
    }
    return {
      weekStart: week,
      expected,
      submitted,
      draft,
      missing: expected - submitted - draft,
      submitRate: rate(submitted, expected),
      byProject: [...byProject.entries()]
        .map(([projectId, sum]) => ({ projectId, personWeeks: round2(sum / 100) }))
        .sort((a, b) => a.projectId - b.projectId),
    };
  });

  const memberStats: MemberStat[] = members.map((m) => {
    let expectedWeeks = 0;
    let submittedWeeks = 0;
    let draftWeeks = 0;
    const unsubmittedWeeks: string[] = [];
    const byProject = new Map<number, number>();
    for (const week of weeks) {
      if (!isExpected(m, week)) continue;
      expectedWeeks++;
      const r = reportOf.get(m.userId)?.get(week);
      if (r?.status === "SUBMITTED") {
        submittedWeeks++;
        for (const it of itemsOf.get(r.id) ?? []) {
          byProject.set(it.projectId, (byProject.get(it.projectId) ?? 0) + it.participationRate);
        }
      } else {
        if (r) draftWeeks++;
        unsubmittedWeeks.push(week);
      }
    }
    return {
      userId: m.userId,
      expectedWeeks,
      submittedWeeks,
      draftWeeks,
      missingWeeks: expectedWeeks - submittedWeeks - draftWeeks,
      submitRate: rate(submittedWeeks, expectedWeeks),
      unsubmittedWeeks: unsubmittedWeeks.reverse(),
      byProject: [...byProject.entries()]
        .map(([projectId, sum]) => ({
          projectId,
          personWeeks: round2(sum / 100),
          avgRate: round2(sum / submittedWeeks),
        }))
        .sort((a, b) => a.projectId - b.projectId),
    };
  });

  const monthKeys = [...new Set(weeks.map(monthOfWeek))];
  const monthStats: MonthStat[] = monthKeys.map((month) => {
    const monthWeeks = weeks.filter((w) => monthOfWeek(w) === month);
    return {
      month,
      weeks: monthWeeks.length,
      members: members.map((m) => {
        let expectedWeeks = 0;
        let submittedWeeks = 0;
        const byProject = new Map<number, number>();
        for (const week of monthWeeks) {
          if (!isExpected(m, week)) continue;
          expectedWeeks++;
          const r = reportOf.get(m.userId)?.get(week);
          if (r?.status !== "SUBMITTED") continue;
          submittedWeeks++;
          for (const it of itemsOf.get(r.id) ?? []) {
            byProject.set(it.projectId, (byProject.get(it.projectId) ?? 0) + it.participationRate);
          }
        }
        return {
          userId: m.userId,
          expectedWeeks,
          submittedWeeks,
          byProject: [...byProject.entries()]
            .map(([projectId, sum]) => ({
              projectId,
              avgRate: round2(sum / submittedWeeks),
              personWeeks: round2(sum / 100),
            }))
            .sort((a, b) => a.projectId - b.projectId),
        };
      }),
    };
  });

  return { weeks: weekStats, members: memberStats, months: monthStats };
}
