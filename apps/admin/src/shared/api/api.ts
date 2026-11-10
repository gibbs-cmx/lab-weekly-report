import { get, post } from "./http";
import type {
  AdminReportDetail,
  ExportRows,
  LoginResult,
  Participation,
  PeriodStats,
  Project,
  ProjectInput,
  User,
  UserInput,
  WeekStatus,
} from "./types";

export const api = {
  login: (email: string, password: string) => post<LoginResult>("/auth/login", { email, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    post<{ message: string; accessToken: string }>("/auth/change-password", {
      currentPassword,
      newPassword,
    }),

  // 프로젝트
  getProjects: (status?: string) => get<Project[]>("/admin/projects", { status }),
  createProject: (input: ProjectInput) => post<Project>("/admin/projects", input),
  updateProject: (id: number, input: Partial<ProjectInput>) =>
    post<Project>(`/admin/projects/${id}/update`, input),
  deleteProject: (id: number) => post<{ message: string }>(`/admin/projects/${id}/delete`),

  // 사용자
  getUsers: (includeInactive?: boolean) => get<User[]>("/admin/users", { includeInactive }),
  createUser: (input: UserInput) =>
    post<{ user: User; tempPassword: string }>("/admin/users", input),
  updateUser: (id: number, input: UserInput) => post<User>(`/admin/users/${id}/update`, input),
  resetPassword: (id: number) =>
    post<{ tempPassword: string }>(`/admin/users/${id}/reset-password`),

  // 주간보고
  getWeekStatus: (weekStart: string) => get<WeekStatus>("/admin/reports", { weekStart }),
  getReport: (id: number) => get<AdminReportDetail>(`/admin/reports/${id}`),
  reopenReport: (id: number) => post<AdminReportDetail>(`/admin/reports/${id}/reopen`),
  getParticipation: (params: { from: string; to: string; projectId?: number }) =>
    get<Participation>("/admin/reports/participation", params),
  getExportRows: (params: { from: string; to: string }) =>
    get<ExportRows>("/admin/reports/export", params),
  getStats: (params: { from: string; to: string }) =>
    get<PeriodStats>("/admin/reports/stats", params),
};
