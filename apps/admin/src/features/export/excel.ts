import { formatWeekTag, getWeekEnd } from "@wr/shared";
import writeExcelFile from "write-excel-file/browser";

import { api } from "@/shared/api/api";
import type { ExportRows, Participation, PeriodStats } from "@/shared/api/types";
import { formatKstDateTime } from "@/shared/lib/utils";

type Cell = {
  value: string | number;
  fontWeight?: "bold";
  wrap?: boolean;
  align?: "right";
} | null;
type Sheet = {
  sheet: string;
  data: Cell[][];
  columns: { width: number }[];
  stickyRowsCount: number;
};

const STATUS_LABEL = { SUBMITTED: "제출", DRAFT: "작성중" } as const;

const head = (labels: string[]): Cell[] => labels.map((value) => ({ value, fontWeight: "bold" }));
const text = (value: string): Cell => ({ value, wrap: true });
const num = (value: number | null | undefined): Cell =>
  value == null ? null : { value, align: "right" };

function sheet(name: string, labels: string[], widths: number[], rows: Cell[][]): Sheet {
  return {
    sheet: name,
    data: [head(labels), ...rows],
    columns: widths.map((width) => ({ width })),
    stickyRowsCount: 1,
  };
}

/** 보고서 원본 — 항목(프로젝트) 한 줄씩 */
function reportSheet(rows: ExportRows["rows"]): Sheet {
  return sheet(
    "보고서",
    [
      "주 시작",
      "주 종료",
      "주차",
      "이름",
      "소속",
      "직위",
      "상태",
      "제출일시",
      "과제 코드",
      "프로젝트",
      "참여율(%)",
      "이번 주 수행 내용",
      "다음 주 계획",
      "이슈·건의",
    ],
    [12, 12, 14, 10, 14, 12, 8, 17, 16, 28, 10, 50, 40, 30],
    rows.map((r) => [
      { value: r.weekStart },
      { value: getWeekEnd(r.weekStart) },
      { value: formatWeekTag(r.weekStart) },
      { value: r.name },
      { value: r.department },
      { value: r.position },
      { value: STATUS_LABEL[r.status] },
      { value: formatKstDateTime(r.submittedAt) },
      { value: r.projectCode },
      { value: r.projectName },
      num(r.participationRate),
      text(r.doneText),
      text(r.planText),
      text(r.note),
    ]),
  );
}

/** 제출 현황 화면 — 한 주의 보고서 전체 */
export async function exportWeekReports(week: string): Promise<void> {
  const data = await api.getExportRows({ from: week, to: week });
  await writeExcelFile([reportSheet(data.rows)]).toFile(`주간보고_${week}.xlsx`);
}

/** 통계 화면 — 구성원별 / 월별 / 프로젝트별 / 주차별 / 보고서 원본 */
export async function exportStats(stats: PeriodStats, participation: Participation): Promise<void> {
  const raw = await api.getExportRows({ from: stats.from, to: stats.to });
  const projects = stats.projects;
  const memberById = new Map(stats.members.map((m) => [m.userId, m]));

  const memberSheet = sheet(
    "구성원별",
    [
      "이름",
      "소속",
      "직위",
      "제출률(%)",
      "제출 주",
      "대상 주",
      ...projects.map((p) => `${p.projectName} 평균 참여율(%)`),
      "인·주 합계",
      "미제출 주",
    ],
    [10, 14, 12, 10, 8, 8, ...projects.map(() => 24), 12, 30],
    stats.members.map((m) => {
      const byId = new Map(m.byProject.map((p) => [p.projectId, p]));
      return [
        { value: m.name },
        { value: m.department },
        { value: m.position },
        num(m.submitRate),
        num(m.submittedWeeks),
        num(m.expectedWeeks),
        ...projects.map((p) => num(byId.get(p.projectId)?.avgRate)),
        num(Math.round(m.byProject.reduce((a, p) => a + p.personWeeks, 0) * 100) / 100),
        { value: m.unsubmittedWeeks.join(", ") },
      ];
    }),
  );

  const monthSheet = sheet(
    "월별 참여율",
    ["월", "이름", "소속", "제출 주", "대상 주", ...projects.map((p) => `${p.projectName} (%)`)],
    [10, 10, 14, 8, 8, ...projects.map(() => 24)],
    stats.months.flatMap((mo) =>
      mo.members
        .filter((m) => m.expectedWeeks > 0)
        .map((m) => {
          const byId = new Map(m.byProject.map((p) => [p.projectId, p]));
          const info = memberById.get(m.userId);
          return [
            { value: mo.month },
            { value: info?.name ?? "" },
            { value: info?.department ?? "" },
            num(m.submittedWeeks),
            num(m.expectedWeeks),
            ...projects.map((p) => num(byId.get(p.projectId)?.avgRate)),
          ];
        }),
    ),
  );

  const projectSheet = sheet(
    "프로젝트별",
    ["과제 코드", "프로젝트", "이름", "소속", "보고 주", "인·주", "기간 평균 참여율(%)"],
    [16, 28, 10, 14, 8, 10, 18],
    participation.projects.flatMap((p) =>
      p.members.map((m) => [
        { value: p.projectCode },
        { value: p.projectName },
        { value: m.name },
        { value: m.department },
        num(m.reportedWeeks),
        num(m.personWeeks),
        num(m.avgRate),
      ]),
    ),
  );

  const weekSheet = sheet(
    "주차별",
    [
      "주 시작",
      "주차",
      ...projects.map((p) => `${p.projectName} (인·주)`),
      "합계 (인·주)",
      "제출",
      "대상",
      "제출률(%)",
    ],
    [12, 14, ...projects.map(() => 24), 12, 8, 8, 10],
    stats.weeks.map((w) => {
      const byId = new Map(w.byProject.map((p) => [p.projectId, p.personWeeks]));
      return [
        { value: w.weekStart },
        { value: formatWeekTag(w.weekStart) },
        ...projects.map((p) => num(byId.get(p.projectId))),
        num(Math.round(w.byProject.reduce((a, p) => a + p.personWeeks, 0) * 100) / 100),
        num(w.submitted),
        num(w.expected),
        num(w.submitRate),
      ];
    }),
  );

  await writeExcelFile([
    memberSheet,
    monthSheet,
    projectSheet,
    weekSheet,
    reportSheet(raw.rows),
  ]).toFile(`주간보고_통계_${stats.from}_${stats.to}.xlsx`);
}
