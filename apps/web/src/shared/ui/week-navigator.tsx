"use client";

import { addDays, currentWeekStart } from "@wr/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/shared/lib/utils";

interface WeekNavigatorProps {
  week: string;
  onChange: (week: string) => void;
}

const arrow =
  "flex size-10 items-center justify-center text-sub transition-colors outline-none hover:bg-paper-soft focus-visible:bg-track disabled:pointer-events-none disabled:text-[#c4c2bc]";

/** 이전 주 | 이번 주 | 다음 주 — 미래 주차로는 이동 불가 */
export function WeekNavigator({ week, onChange }: WeekNavigatorProps) {
  const thisWeek = currentWeekStart();
  const isCurrent = week === thisWeek;
  return (
    <div className="flex items-center overflow-hidden rounded-md border border-[#e2e0da] bg-white">
      <button
        type="button"
        aria-label="이전 주"
        className={arrow}
        onClick={() => onChange(addDays(week, -7))}
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        disabled={isCurrent}
        onClick={() => onChange(thisWeek)}
        className={cn(
          "h-10 border-x border-[#eeece6] px-3 text-[13px] font-medium outline-none",
          isCurrent ? "text-ink" : "text-cobalt hover:bg-paper-soft",
        )}
      >
        {isCurrent ? "이번 주" : "이번 주로"}
      </button>
      <button
        type="button"
        aria-label="다음 주"
        className={arrow}
        disabled={week >= thisWeek}
        onClick={() => onChange(addDays(week, 7))}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
