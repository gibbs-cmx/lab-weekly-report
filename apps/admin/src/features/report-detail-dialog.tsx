"use client";

import { formatWeekRange, formatWeekTag } from "@wr/shared";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import { useReopenReport, useReportDetail } from "@/shared/api/queries";
import { projectColor } from "@/shared/lib/project-color";
import { formatKstDateTime } from "@/shared/lib/utils";
import { AllocationBar } from "@/shared/ui/allocation-bar";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogCloseButton, DialogTitle, DrawerContent } from "@/shared/ui/dialog";
import { ReportStatusBadge } from "@/shared/ui/report-status-badge";

interface ReportDetailDrawerProps {
  reportId: number | null;
  onClose: () => void;
  /** 목록의 이전/다음 보고서로 이동 (없으면 버튼 비활성) */
  onPrev?: () => void;
  onNext?: () => void;
}

export function ReportDetailDrawer({ reportId, onClose, onPrev, onNext }: ReportDetailDrawerProps) {
  const { data: report, isLoading, error } = useReportDetail(reportId);
  const reopen = useReopenReport();

  const handleReopen = () => {
    if (!report) return;
    if (
      !window.confirm(`${report.user?.name ?? ""}님의 보고서를 재오픈할까요? (작성중 상태로 변경)`)
    )
      return;
    reopen.mutate(report.id, { onError: (e) => window.alert(e.message) });
  };

  return (
    <Dialog open={reportId !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="flex flex-col gap-4 border-b border-line bg-white px-7 py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {report?.user && (
                <Avatar
                  userId={report.user.id}
                  name={report.user.name}
                  className="size-11 text-base"
                />
              )}
              <div className="flex min-w-0 flex-col leading-snug">
                <DialogTitle className="truncate pr-0 text-[17px]">
                  {report?.user?.name ?? "주간보고"}{" "}
                  <span className="text-[13px] font-normal text-muted-foreground">
                    {report?.user?.position}
                  </span>
                </DialogTitle>
                <span className="truncate text-[13px] text-muted-foreground">
                  {[report?.user?.department, report?.user?.email].filter(Boolean).join(" · ")}
                </span>
              </div>
            </div>
            <DialogCloseButton />
          </div>
          {report && (
            <>
              <div className="flex flex-wrap items-center gap-2.5 text-[13px]">
                <span className="font-semibold">{formatWeekTag(report.weekStart)}</span>
                <span aria-hidden="true" className="text-faint">
                  |
                </span>
                <span className="text-sub">{formatWeekRange(report.weekStart)}</span>
                <ReportStatusBadge
                  status={report.status}
                  suffix={
                    report.submittedAt ? formatKstDateTime(report.submittedAt).slice(5) : undefined
                  }
                  className="ml-auto"
                />
              </div>
              <div className="flex flex-col gap-2">
                <AllocationBar
                  className="h-2.5"
                  segments={report.items.map((i) => ({
                    projectId: i.projectId,
                    rate: i.participationRate,
                  }))}
                />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-sub">
                  {report.items.map((i) => (
                    <span key={i.id} className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-[2px]"
                        style={{ background: projectColor(i.projectId) }}
                      />
                      <span className="max-w-40 truncate">{i.projectName}</span>
                      <span className="num">{i.participationRate}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-7 py-5">
          {isLoading && <p className="text-muted-foreground">불러오는 중...</p>}
          {error && <p className="text-bad-fg">{error.message}</p>}
          {report?.items.length === 0 && (
            <p className="text-muted-foreground">입력된 프로젝트가 없습니다.</p>
          )}
          {report?.items.map((it) => (
            <article
              key={it.id}
              className="overflow-hidden rounded-[14px] border border-line bg-white"
            >
              <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: projectColor(it.projectId) }}
                />
                <div className="flex min-w-0 flex-1 flex-col leading-snug">
                  <span className="font-semibold">{it.projectName}</span>
                  <span className="num text-xs text-muted-foreground">{it.projectCode}</span>
                </div>
                <span className="num text-xl font-medium">
                  {it.participationRate}
                  <span className="text-[13px] text-muted-foreground">%</span>
                </span>
              </div>
              <div className="flex flex-col gap-3.5 px-5 py-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    이번 주 수행 내용
                  </span>
                  <p className="leading-[1.7] whitespace-pre-wrap">{it.doneText || "—"}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground">다음 주 계획</span>
                  <p className="leading-[1.7] whitespace-pre-wrap text-ink-soft">
                    {it.planText || "—"}
                  </p>
                </div>
              </div>
            </article>
          ))}
          {report?.note && (
            <div className="flex flex-col gap-1 rounded-[14px] border border-[#f0e2c4] bg-[#fbf5e9] px-5 py-4">
              <span className="text-xs font-semibold text-warn-fg">이슈 · 건의 · 기타</span>
              <p className="leading-[1.7] whitespace-pre-wrap">{report.note}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-white px-7 py-4">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="이전 보고서"
              disabled={!onPrev}
              onClick={onPrev}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="다음 보고서"
              disabled={!onNext}
              onClick={onNext}
            >
              <ChevronRight />
            </Button>
          </div>
          {report?.status === "SUBMITTED" && (
            <Button variant="outline" onClick={handleReopen} disabled={reopen.isPending}>
              <RotateCcw strokeWidth={1.8} /> 재오픈 (제출 취소)
            </Button>
          )}
        </div>
      </DrawerContent>
    </Dialog>
  );
}
