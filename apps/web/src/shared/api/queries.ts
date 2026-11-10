"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import { queryKeys } from "./query-keys";
import type { SaveReportInput } from "./types";

export function useActiveProjects() {
  return useQuery({ ...queryKeys.projects.active, queryFn: api.getProjects });
}

export function useMyReports(from?: string, to?: string) {
  return useQuery({
    ...queryKeys.reports.mine(from, to),
    queryFn: () => api.getMyReports({ from, to }),
  });
}

export function useMyStats(from?: string, to?: string) {
  return useQuery({
    ...queryKeys.reports.stats(from, to),
    queryFn: () => api.getMyStats({ from, to }),
  });
}

export function useMyWeekReport(weekStart: string) {
  return useQuery({
    ...queryKeys.reports.week(weekStart),
    queryFn: () => api.getMyWeek(weekStart),
  });
}

/** 임시저장/제출 — 성공 시 해당 주 + 목록 쿼리 갱신 */
export function useSaveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, submit }: { input: SaveReportInput; submit: boolean }) =>
      submit ? api.submit(input) : api.saveDraft(input),
    onSuccess: (report) => {
      qc.setQueryData(queryKeys.reports.week(report.weekStart).queryKey, report);
      void qc.invalidateQueries({ queryKey: queryKeys.reports.mine._def });
      void qc.invalidateQueries({ queryKey: queryKeys.reports.stats._def });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => api.changePassword(currentPassword, newPassword),
  });
}
