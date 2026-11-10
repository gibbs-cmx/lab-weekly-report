import {
  addDays,
  currentWeekStart,
  formatWeekLabel,
  getIsoWeek,
  getWeekStart,
  isWeekStart,
  listWeekStarts,
  validateReportItems,
} from "@wr/shared";
import { describe, expect, it } from "vitest";

describe("주차 유틸", () => {
  it("getWeekStart — 월요일로 보정 (일요일은 전주 월요일)", () => {
    expect(getWeekStart("2026-11-10")).toBe("2026-11-09"); // 화
    expect(getWeekStart("2026-11-09")).toBe("2026-11-09"); // 월
    expect(getWeekStart("2026-11-15")).toBe("2026-11-09"); // 일
    expect(getWeekStart("2027-01-01")).toBe("2026-12-28"); // 연도 경계
  });

  it("isWeekStart — 월요일 + 유효한 날짜만", () => {
    expect(isWeekStart("2026-11-09")).toBe(true);
    expect(isWeekStart("2026-11-10")).toBe(false);
    expect(isWeekStart("2026-02-30")).toBe(false);
    expect(isWeekStart("abc")).toBe(false);
  });

  it("currentWeekStart — KST 기준 (UTC 일요일 16시 = KST 월요일 01시)", () => {
    expect(currentWeekStart(new Date("2026-11-15T16:00:00Z"))).toBe("2026-11-16");
    expect(currentWeekStart(new Date("2026-11-15T14:00:00Z"))).toBe("2026-11-09");
  });

  it("ISO 주차와 라벨", () => {
    expect(getIsoWeek("2026-11-09")).toEqual({ year: 2026, week: 46 });
    expect(getIsoWeek("2026-12-28")).toEqual({ year: 2026, week: 53 });
    expect(formatWeekLabel("2026-11-09")).toBe("2026년 46주차 (11/09 ~ 11/13)");
  });

  it("listWeekStarts — 양 끝 포함", () => {
    expect(listWeekStarts("2026-11-04", "2026-11-17")).toEqual([
      "2026-11-02",
      "2026-11-09",
      "2026-11-16",
    ]);
    expect(addDays("2026-11-09", 7)).toBe("2026-11-16");
  });
});

describe("validateReportItems", () => {
  const item = (projectId: number, participationRate: number, doneText = "작업") => ({
    projectId,
    participationRate,
    doneText,
  });

  it("제출 — 합계 100% + 내용 입력이면 통과", () => {
    expect(validateReportItems([item(1, 70), item(2, 30)], { forSubmit: true })).toEqual([]);
  });

  it("제출 — 합계가 100% 가 아니면 실패", () => {
    const errors = validateReportItems([item(1, 70)], { forSubmit: true });
    expect(errors).toEqual(["참여율 합계가 100%여야 제출할 수 있습니다 (현재 70%)"]);
  });

  it("제출 — 항목 없음 / 내용 없음 실패", () => {
    expect(validateReportItems([], { forSubmit: true })).toContain(
      "프로젝트를 1개 이상 입력해주세요",
    );
    expect(validateReportItems([item(1, 100, " ")], { forSubmit: true })).toContain(
      "1번째 항목: 수행 내용을 입력해주세요",
    );
  });

  it("임시저장 — 합계 100% 미만, 내용 없음은 허용", () => {
    expect(validateReportItems([item(1, 30, "")], { forSubmit: false })).toEqual([]);
    expect(validateReportItems([], { forSubmit: false })).toEqual([]);
  });

  it("공통 — 100% 초과, 중복 프로젝트, 범위 밖 참여율 실패", () => {
    expect(validateReportItems([item(1, 80), item(2, 30)], { forSubmit: false })).toContain(
      "참여율 합계(110%)가 100%를 초과합니다",
    );
    expect(validateReportItems([item(1, 50), item(1, 50)], { forSubmit: false })).toContain(
      "2번째 항목: 같은 프로젝트가 중복되었습니다",
    );
    expect(validateReportItems([item(1, 0)], { forSubmit: false })[0]).toMatch(/1~100 사이 정수/);
    expect(validateReportItems([item(1, 12.5)], { forSubmit: false })[0]).toMatch(/정수/);
  });
});
