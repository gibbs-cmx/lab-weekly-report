"use client";

import { cn } from "@/shared/lib/utils";

/** 세그먼트 컨트롤 — 필터 탭, 상태 전환 등 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex gap-1 rounded-md bg-track p-1", className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 flex-1 rounded-[7px] px-3.5 text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/20",
            value === o.value
              ? "bg-white font-semibold text-ink shadow-[0_1px_2px_rgba(21,23,26,0.08)]"
              : "text-sub hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
