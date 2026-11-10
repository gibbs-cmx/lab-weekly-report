import { describe, expect, it } from "vitest";

import { buildStats, monthOfWeek } from "./stats";

const WEEKS = ["2026-10-26", "2026-11-02", "2026-11-09"];

describe("buildStats", () => {
  const input = {
    weeks: WEEKS,
    members: [
      { userId: 1, joinedWeek: "2026-01-05" },
      { userId: 2, joinedWeek: "2026-11-02" }, // 2주차부터 대상
    ],
    reports: [
      { id: 10, userId: 1, weekStart: "2026-10-26", status: "SUBMITTED" as const },
      { id: 11, userId: 1, weekStart: "2026-11-02", status: "SUBMITTED" as const },
      { id: 12, userId: 1, weekStart: "2026-11-09", status: "DRAFT" as const },
      { id: 20, userId: 2, weekStart: "2026-11-09", status: "SUBMITTED" as const },
      { id: 99, userId: 3, weekStart: "2026-11-09", status: "SUBMITTED" as const }, // 대상 아님
    ],
    items: [
      { reportId: 10, projectId: 1, participationRate: 60 },
      { reportId: 10, projectId: 2, participationRate: 40 },
      { reportId: 11, projectId: 1, participationRate: 100 },
      { reportId: 12, projectId: 1, participationRate: 50 }, // 작성중 → 미반영
      { reportId: 20, projectId: 2, participationRate: 100 },
      { reportId: 99, projectId: 1, participationRate: 100 },
    ],
  };

  it("주차별 — 대상/제출/작성중/미작성과 프로젝트별 인·주", () => {
    const { weeks } = buildStats(input);
    expect(weeks[0]).toEqual({
      weekStart: "2026-10-26",
      expected: 1,
      submitted: 1,
      draft: 0,
      missing: 0,
      submitRate: 100,
      byProject: [
        { projectId: 1, personWeeks: 0.6 },
        { projectId: 2, personWeeks: 0.4 },
      ],
    });
    expect(weeks[1]).toMatchObject({
      expected: 2,
      submitted: 1,
      draft: 0,
      missing: 1,
      submitRate: 50,
    });
    expect(weeks[2]).toMatchObject({
      expected: 2,
      submitted: 1,
      draft: 1,
      missing: 0,
      submitRate: 50,
    });
    expect(weeks[2].byProject).toEqual([{ projectId: 2, personWeeks: 1 }]);
  });

  it("구성원별 — 제출률, 미제출 주, 프로젝트별 평균 참여율(합 100%)", () => {
    const { members } = buildStats(input);
    expect(members[0]).toEqual({
      userId: 1,
      expectedWeeks: 3,
      submittedWeeks: 2,
      draftWeeks: 1,
      missingWeeks: 0,
      submitRate: 67,
      unsubmittedWeeks: ["2026-11-09"],
      byProject: [
        { projectId: 1, personWeeks: 1.6, avgRate: 80 },
        { projectId: 2, personWeeks: 0.4, avgRate: 20 },
      ],
    });
    expect(members[1]).toMatchObject({
      expectedWeeks: 2,
      submittedWeeks: 1,
      missingWeeks: 1,
      submitRate: 50,
      unsubmittedWeeks: ["2026-11-02"],
    });
  });

  it("등록 전 주라도 보고서가 있으면 대상에 포함", () => {
    const { members, weeks } = buildStats({
      weeks: WEEKS,
      members: [{ userId: 1, joinedWeek: "2026-11-09" }],
      reports: [{ id: 1, userId: 1, weekStart: "2026-10-26", status: "SUBMITTED" }],
      items: [{ reportId: 1, projectId: 1, participationRate: 100 }],
    });
    expect(members[0]).toMatchObject({ expectedWeeks: 2, submittedWeeks: 1, missingWeeks: 1 });
    expect(weeks[1]).toMatchObject({ expected: 0, submitRate: null });
  });

  it("빈 입력", () => {
    expect(buildStats({ weeks: [], members: [], reports: [], items: [] })).toEqual({
      weeks: [],
      members: [],
      months: [],
    });
  });

  it("월별 — 주는 목요일이 속한 달로 세고, 제출한 주의 평균 참여율을 낸다", () => {
    // 10/26 주의 목요일은 10/29 → 10월, 11/02·11/09 → 11월
    expect(monthOfWeek("2026-10-26")).toBe("2026-10");
    expect(monthOfWeek("2026-09-28")).toBe("2026-10"); // 목요일 10/01
    const { months } = buildStats(input);
    expect(months.map((m) => [m.month, m.weeks])).toEqual([
      ["2026-10", 1],
      ["2026-11", 2],
    ]);
    expect(months[0].members[0]).toEqual({
      userId: 1,
      expectedWeeks: 1,
      submittedWeeks: 1,
      byProject: [
        { projectId: 1, avgRate: 60, personWeeks: 0.6 },
        { projectId: 2, avgRate: 40, personWeeks: 0.4 },
      ],
    });
    // 11월: 구성원 1 은 2주 중 1주만 제출(나머지는 작성중)
    expect(months[1].members[0]).toEqual({
      userId: 1,
      expectedWeeks: 2,
      submittedWeeks: 1,
      byProject: [{ projectId: 1, avgRate: 100, personWeeks: 1 }],
    });
    expect(months[1].members[1]).toMatchObject({ userId: 2, expectedWeeks: 2, submittedWeeks: 1 });
  });
});
