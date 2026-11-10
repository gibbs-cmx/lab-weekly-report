import { formatWeekTag } from "@wr/shared";
import Link from "next/link";

import type { PeriodStats } from "@/shared/api/types";
import { projectColor } from "@/shared/lib/project-color";
import { cn } from "@/shared/lib/utils";
import { AllocationBar } from "@/shared/ui/allocation-bar";
import { Avatar } from "@/shared/ui/avatar";
import { Card } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/shared/ui/table";

const MAX_WEEK_CHIPS = 3;

/** 구성원별 — 제출 성실도 + 프로젝트별 평균 참여율 매트릭스 */
export function MemberView({ data }: { data: PeriodStats }) {
  const cols = data.projects;

  return (
    <>
      <Card aria-label="구성원별 제출 및 참여율">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-5 py-4">
          <span className="text-[13px] font-semibold text-sub">
            구성원별 제출 · 프로젝트 평균 참여율
          </span>
          <span className="text-xs text-muted-foreground">
            참여율은 제출한 주의 평균 (한 사람의 합계 100%)
          </span>
        </div>
        <Table className="min-w-[920px]">
          <TableHeader>
            <tr>
              <TableHead>구성원</TableHead>
              <TableHead>제출</TableHead>
              <TableHead className="w-[18%]">배분</TableHead>
              {cols.map((p) => (
                <TableHead key={p.projectId} className="max-w-36 text-right">
                  <span className="inline-flex max-w-full items-center justify-end gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-[2px]"
                      style={{ background: projectColor(p.projectId) }}
                    />
                    <span className="truncate" title={p.projectName}>
                      {p.projectName}
                    </span>
                  </span>
                </TableHead>
              ))}
              <TableHead className="text-right">인·주</TableHead>
              <TableHead>미제출 주</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {data.members.length === 0 && (
              <TableMessage colSpan={cols.length + 5}>구성원이 없습니다.</TableMessage>
            )}
            {data.members.map((m) => {
              const byId = new Map(m.byProject.map((p) => [p.projectId, p]));
              const personWeeks = m.byProject.reduce((a, p) => a + p.personWeeks, 0);
              const low = m.submitRate !== null && m.submitRate < 100;
              return (
                <TableRow key={m.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar userId={m.userId} name={m.name} />
                      <div className="flex flex-col leading-snug">
                        <span className="font-semibold whitespace-nowrap">
                          {m.name}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {m.position}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">{m.department}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className={cn("num font-medium", low ? "text-bad-fg" : "text-ink")}>
                      {m.submitRate === null ? "—" : `${m.submitRate}%`}
                    </span>{" "}
                    <span className="num text-xs text-muted-foreground">
                      {m.submittedWeeks}/{m.expectedWeeks}주
                    </span>
                  </TableCell>
                  <TableCell>
                    {m.byProject.length > 0 ? (
                      <AllocationBar
                        segments={m.byProject.map((p) => ({
                          projectId: p.projectId,
                          rate: p.avgRate,
                        }))}
                      />
                    ) : (
                      <span className="text-xs text-faint">—</span>
                    )}
                  </TableCell>
                  {cols.map((p) => {
                    const v = byId.get(p.projectId);
                    return (
                      <TableCell
                        key={p.projectId}
                        className={cn("num text-right", v ? "text-ink" : "text-faint")}
                      >
                        {v ? `${v.avgRate.toFixed(1)}%` : "—"}
                      </TableCell>
                    );
                  })}
                  <TableCell className="num text-right font-medium">
                    {personWeeks.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {m.unsubmittedWeeks.length === 0 ? (
                      <span className="text-xs text-muted-foreground">없음</span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-1">
                        {m.unsubmittedWeeks.slice(0, MAX_WEEK_CHIPS).map((w) => (
                          <Link
                            key={w}
                            href={`/?week=${w}`}
                            title={`${formatWeekTag(w)} 제출 현황 보기`}
                            className="num inline-flex h-6 items-center rounded-full bg-bad-bg px-2 text-xs font-medium text-bad-fg hover:underline"
                          >
                            {w.slice(5).replace("-", "/")}
                          </Link>
                        ))}
                        {m.unsubmittedWeeks.length > MAX_WEEK_CHIPS && (
                          <span className="text-xs text-muted-foreground">
                            외 {m.unsubmittedWeeks.length - MAX_WEEK_CHIPS}주
                          </span>
                        )}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">
        제출률 = 제출한 주 ÷ 제출 대상 주. 대상은 계정이 등록된 주부터 셉니다. 미제출 주를 누르면 그
        주의 제출 현황으로 이동합니다.
      </p>
    </>
  );
}
