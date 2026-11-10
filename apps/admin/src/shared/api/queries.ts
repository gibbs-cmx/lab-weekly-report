"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./api";
import { queryKeys } from "./query-keys";
import type { ProjectInput, UserInput } from "./types";

// ── 프로젝트 ───────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({ ...queryKeys.projects.all, queryFn: () => api.getProjects() });
}

export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: ProjectInput }) =>
      id ? api.updateProject(id, input) : api.createProject(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.projects._def }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteProject(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.projects._def }),
  });
}

// ── 사용자 ─────────────────────────────────────────────────────────────

export function useUsers(includeInactive: boolean) {
  return useQuery({
    ...queryKeys.users.list(includeInactive),
    queryFn: () => api.getUsers(includeInactive),
  });
}

export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: UserInput }) =>
      id ? { user: await api.updateUser(id, input), tempPassword: null } : api.createUser(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.users._def }),
  });
}

export function useResetPassword() {
  return useMutation({ mutationFn: (id: number) => api.resetPassword(id) });
}

// ── 주간보고 ───────────────────────────────────────────────────────────

export function useWeekStatus(weekStart: string) {
  return useQuery({
    ...queryKeys.reports.week(weekStart),
    queryFn: () => api.getWeekStatus(weekStart),
  });
}

export function useReportDetail(reportId: number | null) {
  return useQuery({
    ...queryKeys.reports.detail(reportId ?? 0),
    queryFn: () => api.getReport(reportId!),
    enabled: !!reportId,
  });
}

export function useReopenReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.reopenReport(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.reports._def }),
  });
}

export function useParticipation(from: string, to: string) {
  return useQuery({
    ...queryKeys.reports.participation(from, to),
    queryFn: () => api.getParticipation({ from, to }),
    enabled: !!from && !!to && from <= to,
  });
}

export function usePeriodStats(from: string, to: string) {
  return useQuery({
    ...queryKeys.reports.stats(from, to),
    queryFn: () => api.getStats({ from, to }),
    enabled: !!from && !!to && from <= to,
  });
}
