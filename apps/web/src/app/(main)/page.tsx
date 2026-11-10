"use client";

import { formatWeekRange, formatWeekTag } from "@wr/shared";
import { Suspense } from "react";

import { ReportEditor } from "@/features/report-editor/report-editor";
import { useActiveProjects, useMyWeekReport } from "@/shared/api/queries";
import { useWeekParam } from "@/shared/lib/use-week-param";
import { ReportStatusBadge } from "@/shared/ui/report-status-badge";
import { WeekNavigator } from "@/shared/ui/week-navigator";
import { PageHeader } from "@/widgets/layout/ui/page-header";

function WriteReport() {
  const [week, setWeek] = useWeekParam();
  const projects = useActiveProjects();
  const report = useMyWeekReport(week);

  const loading = projects.isLoading || report.isLoading;
  const error = projects.error ?? report.error;

  return (
    <>
      <PageHeader
        eyebrow={formatWeekTag(week)}
        title={formatWeekRange(week)}
        actions={
          <>
            {!loading && !error && (
              <ReportStatusBadge status={report.data?.status ?? "NONE"} className="h-7 px-3" />
            )}
            <WeekNavigator week={week} onChange={setWeek} />
          </>
        }
      />
      {loading && <p className="text-muted-foreground">불러오는 중...</p>}
      {error && <p className="text-bad-fg">{error.message}</p>}
      {!loading && !error && (
        <ReportEditor
          // 주차가 바뀌면 서버 데이터로 편집 상태를 다시 초기화
          key={week}
          week={week}
          report={report.data ?? null}
          projects={projects.data ?? []}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <WriteReport />
    </Suspense>
  );
}
