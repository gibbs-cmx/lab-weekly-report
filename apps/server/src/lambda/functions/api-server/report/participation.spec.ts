import { describe, expect, it } from "vitest";

import { aggregateParticipation } from "./participation";

describe("aggregateParticipation", () => {
  it("빈 입력이면 빈 배열", () => {
    expect(aggregateParticipation([], 4)).toEqual([]);
  });

  it("프로젝트별/사용자별 인·주와 평균 참여율을 계산", () => {
    const rows = [
      { projectId: 1, userId: 10, weekStart: "2026-11-02", participationRate: 60 },
      { projectId: 2, userId: 10, weekStart: "2026-11-02", participationRate: 40 },
      { projectId: 1, userId: 10, weekStart: "2026-11-09", participationRate: 100 },
      { projectId: 1, userId: 20, weekStart: "2026-11-09", participationRate: 50 },
    ];
    const result = aggregateParticipation(rows, 2);

    expect(result.map((p) => p.projectId)).toEqual([1, 2]);
    const p1 = result[0];
    expect(p1.personWeeks).toBe(2.1);
    expect(p1.memberCount).toBe(2);
    expect(p1.members[0]).toEqual({ userId: 10, reportedWeeks: 2, personWeeks: 1.6, avgRate: 80 });
    expect(p1.members[1]).toEqual({ userId: 20, reportedWeeks: 1, personWeeks: 0.5, avgRate: 25 });
    expect(result[1].members[0]).toEqual({
      userId: 10,
      reportedWeeks: 1,
      personWeeks: 0.4,
      avgRate: 20,
    });
  });

  it("기간 주 수가 0이면 avgRate 는 0", () => {
    const result = aggregateParticipation(
      [{ projectId: 1, userId: 1, weekStart: "2026-11-02", participationRate: 30 }],
      0,
    );
    expect(result[0].members[0].avgRate).toBe(0);
  });
});
