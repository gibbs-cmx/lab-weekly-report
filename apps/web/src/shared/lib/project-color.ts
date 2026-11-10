/**
 * 프로젝트 고유 색 — DB 에 저장하지 않고 프로젝트 id 로 팔레트를 순환.
 * 같은 프로젝트는 모든 화면(작성, 제출 현황, 집계)에서 같은 색으로 보인다.
 */
const PALETTE = [
  { color: "#2F4FD9", tint: "#E9ECFB" }, // 코발트
  { color: "#008F6E", tint: "#E1F2EE" }, // 틸
  { color: "#C98213", tint: "#F7EEDD" }, // 앰버
  { color: "#5B3FC4", tint: "#EFEAF9" }, // 바이올렛
  { color: "#B4472F", tint: "#F9E8E3" }, // 러스트
  { color: "#1487B0", tint: "#E4EEF3" }, // 스틸
] as const;

export function projectColor(projectId: number): string {
  return PALETTE[(Math.max(projectId, 1) - 1) % PALETTE.length].color;
}

export function projectTint(projectId: number): string {
  return PALETTE[(Math.max(projectId, 1) - 1) % PALETTE.length].tint;
}

/** 사용자 아바타 색 (id 순환) */
const AVATARS = [
  { bg: "#E9ECFB", fg: "#2F4FD9" },
  { bg: "#E1F2EE", fg: "#0F6E5C" },
  { bg: "#F7EEDD", fg: "#8A5A00" },
  { bg: "#EFEAF9", fg: "#5B3FC4" },
] as const;

export function avatarColor(userId: number) {
  return AVATARS[Math.abs(userId) % AVATARS.length];
}
