/**
 * 참여율 집계 — 순수 함수 (NestJS/Prisma import 금지).
 *
 * 용어
 * - personWeeks (인·주): Σ(참여율/100). 100% 로 1주 참여 = 1.0
 * - avgRate: 보고 기간 전체 주 수 대비 평균 참여율(%) = Σ참여율 / 기간 주 수
 */

export interface ParticipationRow {
  projectId: number;
  userId: number;
  weekStart: string;
  participationRate: number;
}

export interface MemberParticipation {
  userId: number;
  reportedWeeks: number;
  personWeeks: number;
  avgRate: number;
}

export interface ProjectParticipation {
  projectId: number;
  personWeeks: number;
  memberCount: number;
  members: MemberParticipation[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function aggregateParticipation(
  rows: ParticipationRow[],
  totalWeeks: number,
): ProjectParticipation[] {
  const byProject = new Map<number, Map<number, { weeks: Set<string>; rateSum: number }>>();

  for (const row of rows) {
    let members = byProject.get(row.projectId);
    if (!members) {
      members = new Map();
      byProject.set(row.projectId, members);
    }
    let m = members.get(row.userId);
    if (!m) {
      m = { weeks: new Set(), rateSum: 0 };
      members.set(row.userId, m);
    }
    m.weeks.add(row.weekStart);
    m.rateSum += row.participationRate;
  }

  const result: ProjectParticipation[] = [];
  for (const [projectId, members] of byProject) {
    const memberList: MemberParticipation[] = [...members.entries()]
      .map(([userId, m]) => ({
        userId,
        reportedWeeks: m.weeks.size,
        personWeeks: round2(m.rateSum / 100),
        avgRate: totalWeeks > 0 ? round2(m.rateSum / totalWeeks) : 0,
      }))
      .sort((a, b) => b.personWeeks - a.personWeeks || a.userId - b.userId);

    result.push({
      projectId,
      personWeeks: round2(memberList.reduce((acc, m) => acc + m.personWeeks, 0)),
      memberCount: memberList.length,
      members: memberList,
    });
  }
  return result.sort((a, b) => b.personWeeks - a.personWeeks || a.projectId - b.projectId);
}
