import type { Participation } from "@/shared/api/types";
import { projectColor } from "@/shared/lib/project-color";
import { Card } from "@/shared/ui/card";

/** 프로젝트별 — 투입 비중 막대 + 프로젝트 카드(인·주, 구성원별 평균 참여율) */
export function ProjectView({ data }: { data: Participation }) {
  const total = data.projects.reduce((a, p) => a + p.personWeeks, 0);
  const share = (pw: number) => (total > 0 ? (pw / total) * 100 : 0);

  if (data.projects.length === 0) {
    return (
      <Card className="px-6 py-14 text-center text-muted-foreground">
        이 기간에 제출된 보고서가 없습니다.
      </Card>
    );
  }

  return (
    <>
      <Card aria-label="프로젝트별 투입 비중" className="flex flex-col gap-3.5 p-6">
        <span className="text-[13px] font-semibold text-sub">프로젝트별 투입 비중</span>
        <div aria-hidden="true" className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
          {data.projects.map((p) => (
            <div
              key={p.projectId}
              style={{ width: `${share(p.personWeeks)}%`, background: projectColor(p.projectId) }}
            />
          ))}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
          {data.projects.map((p) => (
            <li key={p.projectId} className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2 rounded-[2px]"
                style={{ background: projectColor(p.projectId) }}
              />
              {p.projectName}
              <span className="num text-muted-foreground">{Math.round(share(p.personWeeks))}%</span>
            </li>
          ))}
        </ul>
      </Card>

      <section
        aria-label="프로젝트별 상세"
        className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-4"
      >
        {data.projects.map((p) => {
          const color = projectColor(p.projectId);
          return (
            <Card key={p.projectId} className="flex flex-col">
              <div aria-hidden="true" className="h-1" style={{ background: color }} />
              <div className="flex flex-col gap-3.5 border-b border-line-soft px-6 pt-[22px] pb-[18px]">
                <div className="flex flex-col leading-snug">
                  <h2 className="text-[15px] font-semibold">{p.projectName}</h2>
                  <span className="num text-xs text-muted-foreground">{p.projectCode}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="num text-[34px] leading-none font-medium tracking-[-0.02em]">
                    {p.personWeeks.toFixed(2)}
                    <span className="font-sans text-[13px] font-normal text-muted-foreground">
                      {" "}
                      인·주
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{p.memberCount}명 참여</span>
                </div>
              </div>
              <ul className="flex flex-col gap-3 px-6 pt-3.5 pb-5">
                {p.members.map((m) => (
                  <li key={m.userId} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span>
                        <span className="font-semibold">{m.name}</span>{" "}
                        <span className="text-xs text-muted-foreground">
                          {m.reportedWeeks}주 보고
                        </span>
                      </span>
                      <span className="num font-medium" title="기간 평균 참여율">
                        {m.avgRate.toFixed(1)}%
                      </span>
                    </div>
                    <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-track">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${Math.min(m.avgRate, 100)}%`, background: color }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </section>
      <p className="text-xs text-muted-foreground">
        인·주 = Σ(참여율 ÷ 100). 구성원별 % 는 기간 전체 {data.totalWeeks}주에 대한 평균
        참여율입니다.
      </p>
    </>
  );
}
