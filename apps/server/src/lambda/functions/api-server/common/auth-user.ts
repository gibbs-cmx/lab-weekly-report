import type { Role } from "@wr/shared";

/** JWT 에서 복원되어 req.user 에 실리는 사용자 정보 */
export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  name: string;
  /** 임시 비밀번호 상태 — 비밀번호 변경 전에는 다른 API 사용 불가 */
  mustChangePassword?: boolean;
}
