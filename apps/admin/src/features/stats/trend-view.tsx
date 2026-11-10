"use client";

import { formatWeekRange, formatWeekTag } from "@wr/shared";
import { useState } from "react";

import type { PeriodStats } from "@/shared/api/types";
import { projectColor } from "@/shared/lib/project-color";
import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const PLOT_H = 220;
const RATE_H = 72;
const md = (w: string) => w.slice(5).replace("-", "/");

/** 눈금 최댓값을 보기 좋은 수로 올림 (0.5 / 1 / 2 / 5 × 10ⁿ 단위) */
function niceMax(v: number): { max: number; ticks: number[] } {
  if (v <= 0) return { max: 1, ticks: [0, 0.5, 1] };
  const rough = v / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  const max = Math.ceil(v / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= max + step / 1000; t += step) ticks.push(Math.round(t * 100) / 100);
  return { max, ticks };
}

/** 주차별 추이 — 프로젝트별 투입(누적 막대) + 제출률(막대). 축은 차트마다 하나씩 */
export function TrendView({ data }: { data: PeriodStats }) {
  const [hover, setHover] = useState<number | null>(null);
  const weeks = data.weeks;
  const n = weeks.length;
  const totals = weeks.map((w) => w.byProject.reduce((a, p) => a + p.personWeeks, 0));
  const { max, ticks } = niceMax(Math.max(0, ...totals));
  const projectName = new Map(data.projects.map((p) => [p.projectId, p.projectName]));
  // x축 라벨은 겹치지 않게 일정 간격으로만
  const labelEvery = Math.max(1, Math.ceil(n / 8));
  const active = hover !== null ? weeks[hover] : null;

  const column = (i: number, children: React.ReactNode, label: string) => (
    <div
      key={weeks[i].weekStart}
      role="img"
      tabIndex={0}
      aria-label={label}
      onMouseEnter={() => setHover(i)}
      onMouseLeave={() => setHover(null)}
      onFocus={() => setHover(i)}
      onBlur={() => setHover(null)}
      className={cn(
        "flex h-full min-w-0 flex-1 flex-col justify-end outline-none",
        hover === i ? "bg-ink/[0.04]" : "",
        "focus-visible:bg-ink/[0.06]",
      )}
    >
      <div className="mx-auto w-3/4 max-w-14">{children}</div>
    </div>
  );

  return (
    <>
      <Card aria-label="주차별 추이" className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <span className="text-[13px] font-semibold text-sub">주차별 프로젝트 투입 (인·주)</span>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            {data.projects.map((p) => (
              <li key={p.projectId} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-[2px]"
                  style={{ background: projectColor(p.projectId) }}
                />
                {p.projectName}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          {/* 투입 누적 막대 */}
          <div className="flex gap-2">
            <div
              aria-hidden="true"
              className="num relative w-8 shrink-0 text-right text-[11px] text-muted-foreground"
              style={{ height: PLOT_H }}
            >
              {ticks.map((t) => (
                <span
                  key={t}
                  className="absolute right-0 translate-y-1/2"
                  style={{ bottom: `${(t / max) * 100}%` }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="relative min-w-0 flex-1" style={{ height: PLOT_H }}>
              {ticks.map((t) => (
                <div
                  key={t}
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 border-t",
                    t === 0 ? "border-line-strong" : "border-line-soft",
                  )}
                  style={{ bottom: `${(t / max) * 100}%` }}
                />
              ))}
              <div className="absolute inset-0 flex">
                {weeks.map((w, i) =>
                  column(
                    i,
                    <div className="flex flex-col-reverse gap-0.5 overflow-hidden rounded-t-[4px]">
                      {w.byProject.map((p) => (
                        <div
                          key={p.projectId}
                          style={{
                            height: Math.max((p.personWeeks / max) * PLOT_H - 2, 1),
                            background: projectColor(p.projectId),
                          }}
                        />
                      ))}
                    </div>,
                    `${formatWeekTag(w.weekStart)} 투입 ${totals[i].toFixed(2)} 인·주`,
                  ),
                )}
              </div>
            </div>
          </div>

          {/* 제출률 막대 */}
          <div className="mt-6 mb-2 flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-sub">주차별 제출률 (%)</span>
          </div>
          <div className="flex gap-2">
            <div
              aria-hidden="true"
              className="num relative w-8 shrink-0 text-right text-[11px] text-muted-foreground"
              style={{ height: RATE_H }}
            >
              <span className="absolute right-0 bottom-full translate-y-1/2">100</span>
              <span className="absolute right-0 bottom-0 translate-y-1/2">0</span>
            </div>
            <div className="relative min-w-0 flex-1" style={{ height: RATE_H }}>
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 border-t border-line-soft"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 border-t border-line-strong"
              />
              <div className="absolute inset-0 flex">
                {weeks.map((w, i) =>
                  column(
                    i,
                    w.submitRate === null ? null : (
                      <div
                        className={cn(
                          "rounded-t-[4px]",
                          w.submitRate === 100 ? "bg-ink" : "bg-[#8c9097]",
                        )}
                        style={{
                          height: Math.max((w.submitRate / 100) * RATE_H, w.submitRate > 0 ? 2 : 0),
                        }}
                      />
                    ),
                    `${formatWeekTag(w.weekStart)} 제출률 ${w.submitRate === null ? "대상 없음" : `${w.submitRate}%`}`,
                  ),
                )}
              </div>
            </div>
          </div>

          {/* x축 */}
          <div aria-hidden="true" className="mt-2 flex gap-2">
            <div className="w-8 shrink-0" />
            <div className="num flex min-w-0 flex-1 text-[11px] text-muted-foreground">
              {weeks.map((w, i) => (
                <span key={w.weekStart} className="min-w-0 flex-1 text-center whitespace-nowrap">
                  {i % labelEvery === 0 || i === n - 1 ? md(w.weekStart) : ""}
                </span>
              ))}
            </div>
          </div>

          {/* 툴팁 — 플롯 영역(y축 라벨 제외) 기준으로 호버한 막대 옆에 배치 */}
          {active && hover !== null && (
            <div className="pointer-events-none absolute inset-y-0 right-0 left-10 z-10">
              <div
                role="status"
                className="absolute top-0 w-60 rounded-lg border border-line bg-white p-3.5 text-xs shadow-[0_8px_24px_rgba(21,23,26,0.12)]"
                style={
                  hover < n / 2
                    ? { left: `${((hover + 1) / n) * 100}%`, marginLeft: 4 }
                    : { right: `${((n - hover) / n) * 100}%`, marginRight: 4 }
                }
              >
                <p className="font-semibold text-ink">{formatWeekRange(active.weekStart)}</p>
                <p className="mb-2 text-muted-foreground">{formatWeekTag(active.weekStart)}</p>
                <ul className="flex flex-col gap-1">
                  {active.byProject.map((p) => (
                    <li key={p.projectId} className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-[2px]"
                        style={{ background: projectColor(p.projectId) }}
                      />
                      <span className="min-w-0 flex-1 truncate text-ink-soft">
                        {projectName.get(p.projectId)}
                      </span>
                      <span className="num font-medium text-ink">{p.personWeeks.toFixed(2)}</span>
                    </li>
                  ))}
                  {active.byProject.length === 0 && (
                    <li className="text-muted-foreground">제출된 보고서 없음</li>
                  )}
                </ul>
                <div className="mt-2 flex justify-between border-t border-line-soft pt-2 text-ink-soft">
                  <span>합계</span>
                  <span className="num font-medium text-ink">{totals[hover].toFixed(2)} 인·주</span>
                </div>
                <div className="mt-1 flex justify-between text-ink-soft">
                  <span>제출</span>
                  <span className="num font-medium text-ink">
                    {active.submitted}/{active.expected}명
                    {active.submitRate !== null ? ` · ${active.submitRate}%` : ""}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <details>
          <summary className="cursor-pointer px-5 py-4 text-[13px] font-semibold text-sub outline-none select-none hover:bg-paper-soft focus-visible:bg-paper-soft">
            표로 보기
          </summary>
          <Table className="min-w-[720px] border-t border-line-soft">
            <TableHeader>
              <tr>
                <TableHead>주차</TableHead>
                {data.projects.map((p) => (
                  <TableHead key={p.projectId} className="text-right">
                    {p.projectName}
                  </TableHead>
                ))}
                <TableHead className="text-right">합계 (인·주)</TableHead>
                <TableHead className="text-right">제출</TableHead>
                <TableHead className="text-right">제출률</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {weeks.map((w, i) => {
                const byId = new Map(w.byProject.map((p) => [p.projectId, p.personWeeks]));
                return (
                  <TableRow key={w.weekStart}>
                    <TableCell className="whitespace-nowrap">
                      <span className="num">{md(w.weekStart)}</span>{" "}
                      <span className="text-xs text-muted-foreground">
                        {formatWeekTag(w.weekStart)}
                      </span>
                    </TableCell>
                    {data.projects.map((p) => (
                      <TableCell key={p.projectId} className="num text-right">
                        {byId.has(p.projectId) ? byId.get(p.projectId)?.toFixed(2) : "—"}
                      </TableCell>
                    ))}
                    <TableCell className="num text-right font-medium">
                      {totals[i].toFixed(2)}
                    </TableCell>
                    <TableCell className="num text-right">
                      {w.submitted}/{w.expected}
                    </TableCell>
                    <TableCell className="num text-right">
                      {w.submitRate === null ? "—" : `${w.submitRate}%`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </details>
      </Card>
    </>
  );
}
