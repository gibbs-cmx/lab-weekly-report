"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/shared/api/api";
import { setAuthToken } from "@/shared/api/http";
import { storeAuthUser } from "@/shared/auth/auth-context";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const ADMIN_ONLY = false;

/** 브랜드 패널의 장식용 배분 막대 */
const SAMPLE_BAR = [
  { w: "55%", c: "#5B77F0" },
  { w: "30%", c: "#2BA88C" },
  { w: "15%", c: "#E0A23C" },
];

/** 개발 중 편의: 테스트 계정을 미리 채워둔다 (프로덕션 빌드에서는 빈 값) */
const DEV_LOGIN =
  process.env.NODE_ENV === "development"
    ? { email: "member1@lab.local", password: "test1234" }
    : { email: "", password: "" };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEV_LOGIN.email);
  const [password, setPassword] = useState(DEV_LOGIN.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.login(email, password);
      if (ADMIN_ONLY && result.user.role !== "ADMIN") {
        setError("관리자 권한이 없는 계정입니다.");
        return;
      }
      setAuthToken(result.accessToken);
      storeAuthUser(result.user);
      router.replace(result.user.passwordChanged ? "/" : "/change-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <section
        aria-label="소개"
        className="flex flex-1 flex-col justify-between gap-10 bg-ink px-8 py-10 text-paper md:px-14 md:py-12"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-sm bg-paper font-bold text-ink">
            W
          </div>
          <span className="text-[15px] font-semibold">주간보고{ADMIN_ONLY ? " 관리자" : ""}</span>
        </div>

        <div className="flex max-w-[460px] flex-col gap-7">
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.03em] md:text-[40px]">
            한 주의 연구를
            <br />
            정리하는 시간
          </h1>
          <p className="text-[15px] leading-[1.7] text-side-text">
            프로젝트별로 이번 주에 한 일과 참여율을 기록하세요. 지난주 계획을 불러와 몇 분이면
            작성할 수 있습니다.
          </p>
          <div className="flex flex-col gap-2.5 rounded-[14px] border border-[#2c2f35] bg-side-raised p-5">
            <div className="flex justify-between text-xs text-side-dim">
              <span>이번 주 배분</span>
              <span className="num text-paper">100%</span>
            </div>
            <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {SAMPLE_BAR.map((s) => (
                <div key={s.c} style={{ width: s.w, background: s.c }} />
              ))}
            </div>
          </div>
        </div>

        <span className="text-xs text-[#8a8d93]">Research Lab · Weekly Report</span>
      </section>

      <section aria-label="로그인" className="flex flex-1 items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="flex w-full max-w-[380px] flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">로그인</h2>
            <p className="text-muted-foreground">연구소 계정 이메일로 로그인하세요.</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[13px] text-ink-soft">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-lg text-[15px]"
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-[13px] text-ink-soft">
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-lg text-[15px]"
                required
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="rounded-md bg-bad-bg px-3.5 py-2.5 text-[13px] text-bad-fg">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="h-[50px]" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? "로그인 중..." : "로그인"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            계정이 없거나 비밀번호를 잊으셨다면 {ADMIN_ONLY ? "다른 관리자" : "연구지원팀"}에
            문의하세요.
          </p>
        </form>
      </section>
    </div>
  );
}
