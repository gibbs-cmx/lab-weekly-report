/**
 * 주차 유틸 — 모든 날짜는 "YYYY-MM-DD" 문자열로 주고받는다.
 * 주의 시작은 월요일. "오늘"은 KST(Asia/Seoul) 기준.
 * 내부 계산은 UTC 자정 Date 로 해서 타임존 영향을 받지 않게 한다.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = parseDate(value);
  return !Number.isNaN(d.getTime()) && formatDate(d) === value;
}

/** "YYYY-MM-DD" → UTC 자정 Date */
export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date(UTC 자정 기준) → "YYYY-MM-DD" */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: string, days: number): string {
  return formatDate(new Date(parseDate(value).getTime() + days * DAY_MS));
}

/** 주어진 날짜가 속한 주의 월요일 */
export function getWeekStart(value: string): string {
  const d = parseDate(value);
  const day = d.getUTCDay(); // 0=일 ... 6=토
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(value, diff);
}

export function isWeekStart(value: string): boolean {
  return isDateString(value) && getWeekStart(value) === value;
}

/** KST 기준 오늘 */
export function todayKst(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** KST 기준 이번 주 월요일 */
export function currentWeekStart(now: Date = new Date()): string {
  return getWeekStart(todayKst(now));
}

/** 주의 마지막 날(금요일) — 화면 표시용 */
export function getWeekEnd(weekStart: string): string {
  return addDays(weekStart, 4);
}

/**
 * ISO 8601 주차 (예: 2026년 46주차). 표시용.
 * 해당 주의 목요일이 속한 연도를 기준으로 한다.
 */
export function getIsoWeek(weekStart: string): { year: number; week: number } {
  const thursday = parseDate(addDays(getWeekStart(weekStart), 3));
  const year = thursday.getUTCFullYear();
  const jan4 = parseDate(`${year}-01-04`);
  const firstThursday = parseDate(addDays(getWeekStart(formatDate(jan4)), 3));
  const week = Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * DAY_MS)) + 1;
  return { year, week };
}

/** "2026년 46주차 (11/09 ~ 11/13)" */
export function formatWeekLabel(weekStart: string): string {
  const { year, week } = getIsoWeek(weekStart);
  const s = weekStart.slice(5).replace("-", "/");
  const e = getWeekEnd(weekStart).slice(5).replace("-", "/");
  return `${year}년 ${week}주차 (${s} ~ ${e})`;
}

/** from~to 사이의 주 시작일 목록 (양 끝 포함, 둘 다 월요일로 보정) */
export function listWeekStarts(from: string, to: string): string[] {
  const result: string[] = [];
  let cur = getWeekStart(from);
  const end = getWeekStart(to);
  while (cur <= end) {
    result.push(cur);
    cur = addDays(cur, 7);
  }
  return result;
}

/** "11월 9일 – 11월 13일" — 화면 제목용 (월~금) */
export function formatWeekRange(weekStart: string): string {
  const fmt = (v: string) => `${Number(v.slice(5, 7))}월 ${Number(v.slice(8, 10))}일`;
  return `${fmt(weekStart)} – ${fmt(getWeekEnd(weekStart))}`;
}

/** "2026 · 46주차" — 화면 상단 보조 라벨용 */
export function formatWeekTag(weekStart: string): string {
  const { year, week } = getIsoWeek(weekStart);
  return `${year} · ${week}주차`;
}
