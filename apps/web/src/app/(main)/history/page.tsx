"use client";

import { formatWeekRange, formatWeekTag } from "@wr/shared";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { useMyReports, useMyStats } from "@/shared/api/queries";
import { projectColor } from "@/shared/lib/project-color";
import { cn, formatKstDateTime } from "@/shared/lib/utils";
import { AllocationBar } from "@/shared/ui/allocation-bar";
import { Card } from "@/shared/ui/card";
import { ReportStatusBadge } from "@/shared/ui/report-status-badge";
import { PageHeader } from "@/widgets/layout/ui/page-header";

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-[1_1_150px] flex-col gap-1.5 border-line-soft px-6 py-5 max-sm:border-t sm:border-l sm:first:border-l-0 max-sm:first:border-t-0">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="num text-[28px] leading-tight font-medium">{children}</span>
    </div>
  );
}

const unit = "font-sans text-sm font-normal text-muted-foreground";

export default function HistoryPage() {
  const reports = useMyReports();
  const stats = useMyStats();
  const s = stats.data;

  return (
    <>
      <PageHeader eyebrow="최근 12주" title="내 보고서" />

      {s && (
        <div className="flex flex-wrap items-start gap-4">
          <Card aria-label="제출 요약" className="flex flex-[1_1_320px] flex-wrap">
            <Stat label="제출률">
              {s.submitRate ?? "—"}
              {s.submitRate !== null && <span className={unit}>%</span>}
            </Stat>
            <Stat label="제출한 주">
              {s.submittedWeeks}
              <span className={unit}> / {s.expectedWeeks}주</span>
            </Stat>
            <div className="flex w-full flex-wrap items-center gap-1.5 border-t border-line-soft px-6 py-4 text-[13px]">
              <span className="mr-1 text-sub">미제출 주</span>
              {s.unsubmittedWeeks.length === 0 && (
                <span className="text-muted-foreground">없음</span>
              )}
              {s.unsubmittedWeeks.map((w) => (
                <Link
                  key={w}
                  href={`/?week=${w}`}
                  title={`${formatWeekTag(w)} 작성하기`}
                  className="num inline-flex h-7 items-center rounded-full bg-bad-bg px-2.5 text-xs font-medium text-bad-fg hover:underline"
                >
                  {w.slice(5).replace("-", "/")}
                </Link>
              ))}
            </div>
          </Card>

          <Card
            aria-label="프로젝트별 평균 참여율"
            className="flex flex-[1_1_360px] flex-col gap-4 p-6"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold text-sub">프로젝트별 평균 참여율</span>
              <span className="text-xs text-muted-foreground">제출한 주 평균</span>
            </div>
            {s.byProject.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">제출한 보고서가 없습니다.</p>
            ) : (
              <>
                <AllocationBar
                  className="h-3"
                  segments={s.byProject.map((p) => ({ projectId: p.projectId, rate: p.avgRate }))}
                />
                <ul className="flex flex-col gap-2.5">
                  {s.byProject.map((p) => (
                    <li key={p.projectId} className="flex items-center gap-2.5 text-[13px]">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-[2px]"
                        style={{ background: projectColor(p.projectId) }}
                      />
                      <span className="min-w-0 flex-1 truncate text-ink-soft">{p.projectName}</span>
                      <span className="num text-xs text-muted-foreground">
                        {p.personWeeks.toFixed(2)} 인·주
                      </span>
                      <span className="num w-14 text-right font-medium">
                        {p.avgRate.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      )}

      <Card aria-label="보고서 목록">
        {reports.isLoading && (
          <p className="px-6 py-10 text-center text-muted-foreground">불러오는 중...</p>
        )}
        {reports.error && (
          <p className="px-6 py-10 text-center text-bad-fg">{reports.error.message}</p>
        )}
        {reports.data?.length === 0 && (
          <p className="px-6 py-10 text-center text-muted-foreground">작성한 보고서가 없습니다.</p>
        )}
        <ul>
          {reports.data?.map((r) => (
            <li key={r.id} className="border-t border-line-soft first:border-t-0">
              <Link
                href={`/?week=${r.weekStart}`}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4 transition-colors hover:bg-paper-soft"
              >
                <div className="flex w-44 flex-col leading-snug">
                  <span className="text-[15px] font-semibold">{formatWeekRange(r.weekStart)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatWeekTag(r.weekStart)}
                  </span>
                </div>
                <div className="flex min-w-48 flex-1 flex-col gap-1.5">
                  <AllocationBar
                    segments={r.items.map((i) => ({
                      projectId: i.projectId,
                      rate: i.participationRate,
                    }))}
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    {r.items.length > 0
                      ? r.items.map((i) => `${i.projectName} ${i.participationRate}%`).join(" · ")
                      : "입력된 프로젝트 없음"}
                  </span>
                </div>
                <span
                  className={cn(
                    "num w-12 text-right text-[13px] font-medium",
                    r.totalRate !== 100 && "text-[#b26a00]",
                  )}
                >
                  {r.totalRate}%
                </span>
                <span className="num w-28 text-xs text-muted-foreground max-md:hidden">
                  {r.submittedAt ? formatKstDateTime(r.submittedAt).slice(5) : "—"}
                </span>
                <ReportStatusBadge status={r.status} />
                <ChevronRight aria-hidden="true" className="size-4 text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
