"use client";

import { formatWeekRange, formatWeekTag } from "@wr/shared";
import { Suspense, useMemo, useState } from "react";

import { ExportButton } from "@/features/export/export-button";
import { exportWeekReports } from "@/features/export/excel";
import { ReportDetailDrawer } from "@/features/report-detail-dialog";
import { useWeekStatus } from "@/shared/api/queries";
import type { WeekStatusRow } from "@/shared/api/types";
import { cn, formatKstDateTime } from "@/shared/lib/utils";
import { useWeekParam } from "@/shared/lib/use-week-param";
import { AllocationBar } from "@/shared/ui/allocation-bar";
import { Avatar } from "@/shared/ui/avatar";
import { Card } from "@/shared/ui/card";
import { ReportStatusBadge } from "@/shared/ui/report-status-badge";
import { SearchInput } from "@/shared/ui/search-input";
import { Segmented } from "@/shared/ui/segmented";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/shared/ui/table";
import { WeekNavigator } from "@/shared/ui/week-navigator";
import { PageHeader } from "@/widgets/layout/ui/page-header";

type Filter = "ALL" | WeekStatusRow["status"];

function Kpi({ label, dot, children }: { label: string; dot: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-[1_1_140px] flex-col gap-1.5 border-line-soft px-7 py-6 max-sm:border-t sm:border-l">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span aria-hidden="true" className={cn("size-2 rounded-full", dot)} />
        {label}
      </span>
      <span className="num text-[28px] leading-tight font-medium">{children}</span>
    </div>
  );
}

function WeekStatusPage() {
  const [week, setWeek] = useWeekParam();
  const { data, isLoading, error } = useWeekStatus(week);
  const [openId, setOpenId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.rows ?? []).filter(
      (r) =>
        (filter === "ALL" || r.status === filter) &&
        (!q || `${r.user.name} ${r.user.department} ${r.user.position}`.toLowerCase().includes(q)),
    );
  }, [data, filter, query]);

  // 상세 패널의 이전/다음 — 현재 목록에서 보고서가 있는 행만 순회
  const openable = rows.flatMap((r) => (r.reportId ? [r.reportId] : []));
  const openIdx = openId === null ? -1 : openable.indexOf(openId);

  const s = data?.summary;
  const pct = (n: number) => (s && s.total > 0 ? (n / s.total) * 100 : 0);

  return (
    <>
      <PageHeader
        eyebrow={`제출 현황 · ${formatWeekTag(week)}`}
        title={formatWeekRange(week)}
        actions={
          <>
            <ExportButton onExport={() => exportWeekReports(week)} />
            <WeekNavigator week={week} onChange={setWeek} />
          </>
        }
      />

      {s && (
        <Card aria-label="요약" className="flex flex-wrap">
          <div className="flex flex-[2_1_280px] flex-col gap-1 px-7 py-6">
            <span className="text-xs font-semibold text-muted-foreground">제출률</span>
            <span className="num text-[44px] leading-none font-medium tracking-[-0.03em]">
              {Math.round(pct(s.submitted))}
              <span className="text-xl text-muted-foreground">%</span>
            </span>
            <div
              aria-hidden="true"
              className="mt-2.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-track"
            >
              <div className="bg-ok" style={{ width: `${pct(s.submitted)}%` }} />
              <div className="bg-[#e2a33a]" style={{ width: `${pct(s.draft)}%` }} />
            </div>
          </div>
          <Kpi label="제출" dot="bg-ok">
            {s.submitted}
            <span className="text-sm text-muted-foreground"> / {s.total}</span>
          </Kpi>
          <Kpi label="작성중" dot="bg-[#e2a33a]">
            {s.draft}
          </Kpi>
          <Kpi label="미작성" dot="border-[1.5px] border-bad">
            <span className={s.none > 0 ? "text-bad" : undefined}>{s.none}</span>
          </Kpi>
        </Card>
      )}

      <Card aria-label="구성원별 제출 상태">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
          <Segmented<Filter>
            label="상태 필터"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "ALL", label: `전체 ${s?.total ?? 0}` },
              { value: "SUBMITTED", label: `제출 ${s?.submitted ?? 0}` },
              { value: "DRAFT", label: `작성중 ${s?.draft ?? 0}` },
              { value: "NONE", label: `미작성 ${s?.none ?? 0}` },
            ]}
          />
          <SearchInput value={query} onChange={setQuery} placeholder="이름, 소속 검색" />
        </div>
        <Table className="min-w-[860px]">
          <TableHeader>
            <tr>
              <TableHead>구성원</TableHead>
              <TableHead>프로젝트 배분</TableHead>
              <TableHead className="text-right">합계</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>제출일시</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {isLoading && <TableMessage colSpan={5}>불러오는 중...</TableMessage>}
            {error && (
              <TableMessage colSpan={5} tone="error">
                {error.message}
              </TableMessage>
            )}
            {data && rows.length === 0 && (
              <TableMessage colSpan={5}>해당하는 구성원이 없습니다.</TableMessage>
            )}
            {rows.map((r) => (
              <TableRow
                key={r.user.id}
                className={cn(r.reportId && "cursor-pointer transition-colors hover:bg-paper-soft")}
                onClick={() => r.reportId && setOpenId(r.reportId)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar userId={r.user.id} name={r.user.name} />
                    <div className="flex flex-col leading-snug">
                      {r.reportId ? (
                        <button
                          type="button"
                          className="text-left font-semibold outline-none hover:underline focus-visible:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenId(r.reportId);
                          }}
                        >
                          {r.user.name}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {r.user.position}
                          </span>
                        </button>
                      ) : (
                        <span className="font-semibold">
                          {r.user.name}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            {r.user.position}
                          </span>
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{r.user.department}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-[38%]">
                  {r.items.length > 0 ? (
                    <div className="flex max-w-80 flex-col gap-1.5">
                      <AllocationBar
                        segments={r.items.map((i) => ({
                          projectId: i.projectId,
                          rate: i.participationRate,
                        }))}
                      />
                      <span className="truncate text-xs text-muted-foreground">
                        {r.items.map((i) => `${i.projectName} ${i.participationRate}%`).join(" · ")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-faint">—</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "num text-right font-medium",
                    !r.reportId
                      ? "text-faint"
                      : r.totalRate === 100
                        ? "text-ink"
                        : "text-[#b26a00]",
                  )}
                >
                  {r.reportId ? `${r.totalRate}%` : "—"}
                </TableCell>
                <TableCell>
                  <ReportStatusBadge status={r.status} />
                </TableCell>
                <TableCell className="num text-xs whitespace-nowrap text-muted-foreground">
                  {r.submittedAt ? formatKstDateTime(r.submittedAt).slice(5) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ReportDetailDrawer
        reportId={openId}
        onClose={() => setOpenId(null)}
        onPrev={openIdx > 0 ? () => setOpenId(openable[openIdx - 1]) : undefined}
        onNext={
          openIdx >= 0 && openIdx < openable.length - 1
            ? () => setOpenId(openable[openIdx + 1])
            : undefined
        }
      />
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <WeekStatusPage />
    </Suspense>
  );
}
