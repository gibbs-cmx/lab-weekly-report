import { cn } from "@/shared/lib/utils";

const STYLES = {
  SUBMITTED: { label: "제출", pill: "bg-ok-bg text-ok-fg", dot: "bg-ok" },
  DRAFT: { label: "작성중", pill: "bg-warn-bg text-warn-fg", dot: "bg-warn" },
  NONE: { label: "미작성", pill: "bg-bad-bg text-bad-fg", dot: "bg-bad" },
} as const;

export type ReportStatusKey = keyof typeof STYLES;

export function ReportStatusBadge({
  status,
  suffix,
  className,
}: {
  status: ReportStatusKey;
  /** 라벨 뒤에 덧붙일 텍스트 (예: 제출 시각) */
  suffix?: string;
  className?: string;
}) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        s.pill,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
      {suffix ? ` · ${suffix}` : ""}
    </span>
  );
}
