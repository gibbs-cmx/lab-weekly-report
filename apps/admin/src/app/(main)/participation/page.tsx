"use client";

import { addDays, todayKst } from "@wr/shared";
import { useState } from "react";

import { ExportButton } from "@/features/export/export-button";
import { exportStats } from "@/features/export/excel";
import { MemberView } from "@/features/stats/member-view";
import { MonthView } from "@/features/stats/month-view";
import { ProjectView } from "@/features/stats/project-view";
import { TrendView } from "@/features/stats/trend-view";
import { useParticipation, usePeriodStats } from "@/shared/api/queries";
import { Card } from "@/shared/ui/card";
import { Segmented } from "@/shared/ui/segmented";
import { PageHeader } from "@/widgets/layout/ui/page-header";

type Preset = "month" | "12w" | "year";
type View = "project" | "member" | "month" | "trend";

const PRESET_LABEL: Record<Preset, string> = { month: "이번 달", "12w": "최근 12주", year: "올해" };

function presetRange(preset: Preset, today: string): { from: string; to: string } {
  if (preset === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
  if (preset === "year") return { from: `${today.slice(0, 4)}-01-01`, to: today };
  return { from: addDays(today, -7 * 11), to: today };
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-1.5 rounded-[14px] px-[22px] py-5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="num text-[30px] leading-tight font-medium tracking-[-0.02em]">
        {children}
      </span>
    </Card>
  );
}

const unit = "font-sans text-sm font-normal text-muted-foreground";
const dateClass =
  "num w-[8.5rem] border-0 bg-transparent text-[13px] outline-none focus-visible:text-cobalt";

export default function StatsPage() {
  const today = todayKst();
  const [preset, setPreset] = useState<Preset | null>("12w");
  const [range, setRange] = useState(() => presetRange("12w", today));
  const [view, setView] = useState<View>("project");
  const participation = useParticipation(range.from, range.to);
  const stats = usePeriodStats(range.from, range.to);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    setRange(presetRange(p, today));
  };
  const setDate = (patch: Partial<typeof range>) => {
    setPreset(null);
    setRange((r) => ({ ...r, ...patch }));
  };

  const loading = participation.isLoading || stats.isLoading;
  const error = participation.error ?? stats.error;
  const p = participation.data;
  const s = stats.data;

  const totalPw = p?.projects.reduce((a, x) => a + x.personWeeks, 0) ?? 0;
  const expected = s?.weeks.reduce((a, w) => a + w.expected, 0) ?? 0;
  const submitted = s?.weeks.reduce((a, w) => a + w.submitted, 0) ?? 0;
  const lateMembers = s?.members.filter((m) => m.unsubmittedWeeks.length > 0).length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="통계 · 제출된 보고서 기준"
        title={preset ? PRESET_LABEL[preset] : "기간 지정"}
        actions={
          <>
            <Segmented<Preset>
              label="기간 프리셋"
              value={preset}
              onChange={applyPreset}
              className="bg-[#eceae4]"
              options={[
                { value: "month", label: "이번 달" },
                { value: "12w", label: "12주" },
                { value: "year", label: "올해" },
              ]}
            />
            <div className="flex h-10 items-center gap-1 rounded-md border border-[#e2e0da] bg-white px-3 focus-within:border-cobalt focus-within:ring-4 focus-within:ring-cobalt/12">
              <input
                type="date"
                aria-label="시작일"
                value={range.from}
                max={range.to}
                onChange={(e) => e.target.value && setDate({ from: e.target.value })}
                className={dateClass}
              />
              <span aria-hidden="true" className="text-faint">
                →
              </span>
              <input
                type="date"
                aria-label="종료일"
                value={range.to}
                min={range.from}
                max={today}
                onChange={(e) => e.target.value && setDate({ to: e.target.value })}
                className={dateClass}
              />
            </div>
            <ExportButton
              disabled={!p || !s}
              onExport={() => (p && s ? exportStats(s, p) : Promise.resolve())}
            />
          </>
        }
      />

      {loading && <p className="text-muted-foreground">불러오는 중...</p>}
      {error && <p className="text-bad-fg">{error.message}</p>}

      {p && s && (
        <>
          <section
            aria-label="기간 요약"
            className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3"
          >
            <Stat label="총 투입">
              {totalPw.toFixed(2)}
              <span className={unit}> 인·주</span>
            </Stat>
            <Stat label="평균 제출률">
              {expected > 0 ? Math.round((submitted / expected) * 100) : "—"}
              <span className={unit}>
                {expected > 0 ? "%" : ""} · {submitted}/{expected}건
              </span>
            </Stat>
            <Stat label="미제출이 있는 구성원">
              {lateMembers}
              <span className={unit}> / {s.members.length}명</span>
            </Stat>
            <Stat label="기간">
              {s.totalWeeks}
              <span className={unit}> 주 · 프로젝트 {p.projects.length}개</span>
            </Stat>
          </section>

          <Segmented<View>
            label="보기"
            value={view}
            onChange={setView}
            className="self-start bg-[#eceae4]"
            options={[
              { value: "project", label: "프로젝트별" },
              { value: "member", label: "구성원별" },
              { value: "month", label: "월별" },
              { value: "trend", label: "주차별 추이" },
            ]}
          />

          {view === "project" && <ProjectView data={p} />}
          {view === "member" && <MemberView data={s} />}
          {view === "month" && <MonthView data={s} />}
          {view === "trend" && <TrendView data={s} />}
        </>
      )}
    </>
  );
}
