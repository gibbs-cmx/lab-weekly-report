import { get, post } from "./http";
import type {
  LoginResult,
  MyStats,
  Project,
  Report,
  ReportSummary,
  SaveReportInput,
  User,
} from "./types";

export const api = {
  login: (email: string, password: string) => post<LoginResult>("/auth/login", { email, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    post<{ message: string; accessToken: string }>("/auth/change-password", {
      currentPassword,
      newPassword,
    }),
  getMe: () => get<User>("/users/me"),
  getProjects: () => get<Project[]>("/projects"),
  getMyReports: (params: { from?: string; to?: string } = {}) =>
    get<ReportSummary[]>("/reports", params),
  getMyStats: (params: { from?: string; to?: string } = {}) =>
    get<MyStats>("/reports/stats", params),
  getMyWeek: (weekStart: string) => get<Report | null>("/reports/week", { weekStart }),
  saveDraft: (input: SaveReportInput) => post<Report>("/reports", input),
  submit: (input: SaveReportInput) => post<Report>("/reports/submit", input),
};
