"use client";

import { currentWeekStart, getWeekStart, isDateString } from "@wr/shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** URL ?week=YYYY-MM-DD 로 선택 주차를 관리 (없으면 이번 주). 월요일로 보정 */
export function useWeekParam(): [string, (week: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("week");
  const week = raw && isDateString(raw) ? getWeekStart(raw) : currentWeekStart();

  const setWeek = useCallback(
    (next: string) => {
      const sp = new URLSearchParams(params.toString());
      if (next === currentWeekStart()) sp.delete("week");
      else sp.set("week", next);
      const q = sp.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [params, pathname, router],
  );

  return [week, setWeek];
}
