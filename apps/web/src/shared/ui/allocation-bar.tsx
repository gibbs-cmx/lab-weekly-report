import { projectColor } from "@/shared/lib/project-color";
import { cn } from "@/shared/lib/utils";

export interface AllocationSegment {
  projectId: number;
  rate: number;
}

/** 참여율 배분 막대 — 프로젝트 색 조각을 100% 트랙 위에 나열 */
export function AllocationBar({
  segments,
  className,
}: {
  segments: AllocationSegment[];
  className?: string;
}) {
  const total = segments.reduce((a, s) => a + s.rate, 0);
  return (
    <div
      role="img"
      aria-label={`참여율 합계 ${total}%`}
      className={cn("flex h-2 gap-0.5 overflow-hidden rounded-full bg-track", className)}
    >
      {segments.map((s, i) => (
        <div
          key={`${s.projectId}-${i}`}
          style={{
            width: `${Math.max(0, Math.min(s.rate, 100))}%`,
            background: projectColor(s.projectId),
          }}
        />
      ))}
    </div>
  );
}
