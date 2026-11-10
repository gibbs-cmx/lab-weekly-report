"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { clearAuth, getAuthToken, USER_KEY } from "@/shared/api/http";
import type { User } from "@/shared/api/types";

interface AuthContextType {
  user: User | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, logout: () => {} });

export function storeAuthUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * localStorage 에 저장된 로그인 사용자.
 * - undefined: 아직 하이드레이션 전 (서버 렌더 포함) → 판단 보류
 * - null: 로그인 정보 없음
 */
export function useStoredUser(): User | null | undefined {
  const raw = useSyncExternalStore(
    subscribe,
    () => (getAuthToken() ? localStorage.getItem(USER_KEY) : null),
    () => undefined,
  );
  return useMemo(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }, [raw]);
}

/** 로그인 필요 영역 — 로그인 정보 없으면 /login, 임시 비밀번호면 /change-password 로 보냄 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useStoredUser();
  const ready = !!user && user.passwordChanged;

  useEffect(() => {
    if (user === null) router.replace("/login");
    else if (user && !user.passwordChanged) router.replace("/change-password");
  }, [user, router]);

  const logout = useCallback(() => {
    clearAuth();
    router.replace("/login");
  }, [router]);

  if (!ready) return null;
  return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
