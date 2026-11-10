/**
 * fetch 래퍼 — 토큰 관리 + 에러 메시지 통일.
 * 서버 응답이 비어 있으면(null 반환 API) null 로 돌려준다.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4200/api/v1";

const TOKEN_KEY = "wr-web-token";
export const USER_KEY = "wr-web-user";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith("/auth/")) {
      clearAuth();
      window.location.href = "/login";
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    const err = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(err?.message || `요청에 실패했습니다 (${res.status})`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** GET — params 는 query string 으로 */
export function get<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return request<T>("GET", q ? `${path}?${q}` : path);
}

/** POST — 모든 파라미터는 body 로 */
export function post<T>(path: string, body?: unknown) {
  return request<T>("POST", path, body ?? {});
}
