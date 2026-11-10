"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/shared/api/api";
import { setAuthToken } from "@/shared/api/http";
import { storeAuthUser, useStoredUser } from "@/shared/auth/auth-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export default function ChangePasswordPage() {
  const router = useRouter();
  const user = useStoredUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user === null) router.replace("/login");
  }, [user, router]);

  const firstLogin = user ? !user.passwordChanged : false;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const { accessToken } = await api.changePassword(currentPassword, newPassword);
      setAuthToken(accessToken);
      if (user) storeAuthUser({ ...user, passwordChanged: true });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <Card className="w-full max-w-[420px] rounded-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5 px-7 pt-7 pb-6">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl font-semibold tracking-[-0.01em]">비밀번호 변경</h1>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {firstLogin ? "임시 비밀번호로 로그인했습니다. 새 비밀번호를 설정해주세요. " : ""}
                8자 이상, 영문 대/소문자·숫자·특수문자 중 3종 이상을 조합하세요.
              </p>
            </div>
            {!firstLogin && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current">현재 비밀번호</Label>
                <Input
                  id="current"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new">새 비밀번호</Label>
              <Input
                id="new"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">새 비밀번호 확인</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-md bg-bad-bg px-3.5 py-2.5 text-[13px] text-bad-fg"
              >
                {error}
              </p>
            )}
          </div>
          <div className="flex gap-2 border-t border-line-soft bg-paper-soft px-7 py-4">
            {!firstLogin && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                취소
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "변경 중..." : "변경"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
