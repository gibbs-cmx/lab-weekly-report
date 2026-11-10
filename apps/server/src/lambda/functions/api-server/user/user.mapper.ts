import type { User } from "@prisma/client";

/** API 응답용 사용자 — passwordHash 등 민감 필드 제외 */
export function toUserResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    position: user.position,
    isActive: user.isActive,
    passwordChanged: user.passwordChanged,
    lastLoginAt: user.lastLoginAt,
  };
}

export type UserResponse = ReturnType<typeof toUserResponse>;
