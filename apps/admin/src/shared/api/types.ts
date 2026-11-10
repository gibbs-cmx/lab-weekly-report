/** 서버 응답 타입 (apps/server 의 응답 형태와 1:1) */
import type { ProjectStatus, ReportStatus, Role } from "@wr/shared";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  department: string;
  position: string;
  isActive: boolean;
  passwordChanged: boolean;
  lastLoginAt: string | null;
}

export interface Project {
  id: number;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
}

export interface ReportItem {
  id: number;
  projectId: number;
  projectCode: string;
  projectName: string;
  participationRate: number;
  doneText: string;
  planText: string;
}

export interface Report {
  id: number;
  userId: number;
  weekStart: string;
  status: ReportStatus;
  note: string;
  submittedAt: string | null;
  updatedAt: string;
  totalRate: number;
  items: ReportItem[];
}

export interface ReportSummary {
  id: number;
  weekStart: string;
  status: ReportStatus;
  submittedAt: string | null;
  itemCount: number;
  totalRate: number;
  items: { projectId: number; projectName: string; participationRate: number }[];
}

export interface MyStats {
  from: string;
  to: string;
  totalWeeks: number;
  expectedWeeks: number;
  submittedWeeks: number;
  submitRate: number | null;
  unsubmittedWeeks: string[];
  byProject: {
    projectId: number;
    projectCode: string;
    projectName: string;
    avgRate: number;
    personWeeks: number;
  }[];
}

export interface ExportRows {
  from: string;
  to: string;
  rows: {
    weekStart: string;
    name: string;
    department: string;
    position: string;
    status: ReportStatus;
    submittedAt: string | null;
    note: string;
    projectCode: string;
    projectName: string;
    participationRate: number | null;
    doneText: string;
    planText: string;
  }[];
}

export interface SaveReportInput {
  weekStart: string;
  note?: string;
  items: { projectId: number; participationRate: number; doneText: string; planText?: string }[];
}

export interface LoginResult {
  accessToken: string;
  user: User;
}

// ── 관리자 ─────────────────────────────────────────────────────────────

export interface WeekStatusRow {
  user: User;
  reportId: number | null;
  status: ReportStatus | "NONE";
  submittedAt: string | null;
  itemCount: number;
  totalRate: number;
  items: { projectId: number; projectName: string; participationRate: number }[];
}

export interface WeekStatus {
  weekStart: string;
  summary: { total: number; submitted: number; draft: number; none: number };
  rows: WeekStatusRow[];
}

export interface AdminReportDetail extends Report {
  user: User | null;
}

export interface Participation {
  from: string;
  to: string;
  totalWeeks: number;
  submittedReports: number;
  projects: {
    projectId: number;
    projectCode: string;
    projectName: string;
    personWeeks: number;
    memberCount: number;
    members: {
      userId: number;
      name: string;
      department: string;
      reportedWeeks: number;
      personWeeks: number;
      avgRate: number;
    }[];
  }[];
}

export interface ProjectInput {
  code: string;
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder?: number;
}

export interface UserInput {
  email?: string;
  name?: string;
  role?: Role;
  department?: string;
  position?: string;
  isActive?: boolean;
}

export interface PeriodStats {
  from: string;
  to: string;
  totalWeeks: number;
  projects: { projectId: number; projectCode: string; projectName: string }[];
  weeks: {
    weekStart: string;
    expected: number;
    submitted: number;
    draft: number;
    missing: number;
    submitRate: number | null;
    byProject: { projectId: number; personWeeks: number }[];
  }[];
  months: {
    /** YYYY-MM */
    month: string;
    weeks: number;
    members: {
      userId: number;
      expectedWeeks: number;
      submittedWeeks: number;
      byProject: { projectId: number; avgRate: number; personWeeks: number }[];
    }[];
  }[];
  members: {
    userId: number;
    name: string;
    department: string;
    position: string;
    expectedWeeks: number;
    submittedWeeks: number;
    draftWeeks: number;
    missingWeeks: number;
    submitRate: number | null;
    unsubmittedWeeks: string[];
    byProject: { projectId: number; personWeeks: number; avgRate: number }[];
  }[];
}
