/** 사용자 권한 */
export const ROLES = ["ADMIN", "MEMBER"] as const;
export type Role = (typeof ROLES)[number];

/** 프로젝트 상태 — ACTIVE 만 주간보고에서 선택 가능 */
export const PROJECT_STATUSES = ["ACTIVE", "CLOSED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** 주간보고 상태 */
export const REPORT_STATUSES = ["DRAFT", "SUBMITTED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
