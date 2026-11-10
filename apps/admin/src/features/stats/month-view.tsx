import { Fragment } from "react";

import type { PeriodStats } from "@/shared/api/types";
import { projectColor } from "@/shared/lib/project-color";
import { cn } from "@/shared/lib/utils";
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

/** "2026-11" → "2026.11" */
const ym = (m: string) => m.replace("-", ".");

/** 월별 — 구성원 × 프로젝트의 월 평균 참여율 (과제 참여율 확인용) */
export function MonthView({ data }: { data: PeriodStats }) {
  const months = data.months;
  const projectName = new Map(data.projects.map((p) => [p.projectId, p.projectName]));

  return (
    <>
      <Card aria-label="월별 참여율">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft px-5 py-4">
          <span className="text-[13px] font-semibold text-sub">
            구성원 · 프로젝트별 월 평균 참여율
          </span>
          <span className="text-xs text-muted-foreground">
            그 달에 제출한 주의 평균 (한 사람의 합계 100%)
          </span>
        </div>
        <Table style={{ minWidth: 360 + months.length * 96 }}>
          <TableHeader>
            <tr>
              <TableHead>구성원 / 프로젝트</TableHead>
              {months.map((m) => (
                <TableHead key={m.month} className="num text-right">
                  {ym(m.month)}
                </TableHead>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            {data.members.length === 0 && (
              <TableMessage colSpan={months.length + 1}>구성원이 없습니다.</TableMessage>
            )}
            {data.members.map((member) => {
              const perMonth = months.map((mo) =>
                mo.members.find((x) => x.userId === member.userId),
              );
              // 이 구성원이 기간 중 한 번이라도 참여한 프로젝트 (data.projects 순서 유지)
              const projectIds = data.projects
                .map((p) => p.projectId)
                .filter((id) =>
                  perMonth.some((pm) => pm?.byProject.some((b) => b.projectId === id)),
                );
              return (
                <Fragment key={member.userId}>
                  <TableRow className="bg-paper-soft">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          userId={member.userId}
                          name={member.name}
                          className="size-8 text-xs"
                        />
                        <span className="font-semibold whitespace-nowrap">
                          {member.name}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {[member.department, member.position].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    {perMonth.map((pm, i) => {
                      const none = !pm || pm.expectedWeeks === 0;
                      const partial = !none && pm.submittedWeeks < pm.expectedWeeks;
                      return (
                        <TableCell
                          key={months[i].month}
                          className={cn(
                            "num text-right text-xs whitespace-nowrap",
                            none ? "text-faint" : partial ? "text-bad-fg" : "text-muted-foreground",
                          )}
                          title={none ? "제출 대상 아님" : "제출한 주 / 제출 대상 주"}
                        >
                          {none ? "—" : `${pm.submittedWeeks}/${pm.expectedWeeks}주`}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {projectIds.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={months.length + 1}
                        className="pl-16 text-xs text-muted-foreground"
                      >
                        제출된 보고서 없음
                      </TableCell>
                    </TableRow>
                  )}
                  {projectIds.map((id) => (
                    <TableRow key={id}>
                      <TableCell className="pl-16">
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="size-2 shrink-0 rounded-[2px]"
                            style={{ background: projectColor(id) }}
                          />
                          {projectName.get(id)}
                        </span>
                      </TableCell>
                      {perMonth.map((pm, i) => {
                        const v = pm?.byProject.find((b) => b.projectId === id);
                        return (
                          <TableCell
                            key={months[i].month}
                            className={cn("num text-right", v ? "text-ink" : "text-faint")}
                          >
                            {v ? `${v.avgRate.toFixed(1)}%` : "—"}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <p className="text-xs text-muted-foreground">
        한 주는 그 주의 목요일이 속한 달로 셉니다. 이름 줄의 숫자는 그 달에 제출한 주 / 제출 대상
        주입니다. 조회 기간의 처음과 끝 달은 일부 주만 포함될 수 있습니다.
      </p>
    </>
  );
}
