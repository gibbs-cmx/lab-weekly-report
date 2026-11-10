"use client";

import { Check, Copy, KeyRound, Plus } from "lucide-react";
import { useState } from "react";

import { useResetPassword, useSaveUser, useUsers } from "@/shared/api/queries";
import type { User, UserInput } from "@/shared/api/types";
import { cn, formatKstDateTime } from "@/shared/lib/utils";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { SearchInput } from "@/shared/ui/search-input";
import { Segmented } from "@/shared/ui/segmented";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableMessage,
  TableRow,
} from "@/shared/ui/table";
import { PageHeader } from "@/widgets/layout/ui/page-header";

type Role = NonNullable<UserInput["role"]>;
interface TempPassword {
  name: string;
  email: string;
  pw: string;
}

function UserDialog({
  user,
  onClose,
  onTempPassword,
}: {
  user: User | "new";
  onClose: () => void;
  onTempPassword: (t: TempPassword) => void;
}) {
  const editing = user !== "new" ? user : null;
  const [form, setForm] = useState<UserInput>(
    editing
      ? {
          name: editing.name,
          role: editing.role,
          department: editing.department,
          position: editing.position,
          isActive: editing.isActive,
        }
      : { email: "", name: "", role: "MEMBER", department: "", position: "" },
  );
  const [error, setError] = useState("");
  const save = useSaveUser();
  const set = (patch: Partial<UserInput>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    save.mutate(
      { id: editing?.id, input: form },
      {
        onSuccess: (res) => {
          onClose();
          if (res.tempPassword)
            onTempPassword({ name: res.user.name, email: res.user.email, pw: res.tempPassword });
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <DialogBody>
            <div className="flex flex-col gap-1.5">
              <DialogTitle>{editing ? "사용자 수정" : "사용자 등록"}</DialogTitle>
              <DialogDescription>
                {editing ? editing.email : "등록하면 임시 비밀번호가 한 번 표시됩니다."}
              </DialogDescription>
            </div>
            {!editing && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="u-email">이메일</Label>
                <Input
                  id="u-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="u-name">이름</Label>
              <Input
                id="u-name"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="u-dept">소속</Label>
                <Input
                  id="u-dept"
                  value={form.department}
                  onChange={(e) => set({ department: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="u-pos">직위</Label>
                <Input
                  id="u-pos"
                  value={form.position}
                  onChange={(e) => set({ position: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>권한</Label>
              <Segmented<Role>
                label="권한"
                value={form.role ?? "MEMBER"}
                onChange={(role) => set({ role })}
                className="flex"
                options={[
                  { value: "MEMBER", label: "구성원" },
                  { value: "ADMIN", label: "관리자" },
                ]}
              />
            </div>
            {editing && (
              <label className="flex min-h-11 items-center gap-2.5 text-[13px] text-ink-soft">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set({ isActive: e.target.checked })}
                  className="size-4 accent-ink"
                />
                재직 중 (해제하면 로그인이 차단되고 제출 현황에서 빠집니다)
              </label>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-md bg-bad-bg px-3.5 py-2.5 text-[13px] text-bad-fg"
              >
                {error}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" className="px-6" disabled={save.isPending}>
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TempPasswordDialog({ temp, onClose }: { temp: TempPassword | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!temp) return;
    await navigator.clipboard.writeText(temp.pw);
    setCopied(true);
  };
  return (
    <Dialog
      open={temp !== null}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-[420px]">
        <DialogBody>
          <div
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-lg bg-ok-bg text-ok"
          >
            <KeyRound className="size-5" strokeWidth={1.8} />
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="pr-0">{temp?.name}님의 임시 비밀번호</DialogTitle>
            <DialogDescription>
              이 창을 닫으면 다시 볼 수 없습니다. 사용자에게 전달해주세요. 첫 로그인 때 새
              비밀번호를 설정하게 됩니다.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-paper py-1.5 pr-1.5 pl-4">
            <span className="num min-w-0 flex-1 truncate text-lg font-medium tracking-[0.04em] select-all">
              {temp?.pw}
            </span>
            <Button variant="outline" size="sm" className="h-10 px-3.5" onClick={copy}>
              {copied ? <Check className="text-ok" /> : <Copy strokeWidth={1.8} />}
              {copied ? "복사됨" : "복사"}
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">{temp?.email}</span>
        </DialogBody>
        <DialogFooter>
          <Button className="px-6" onClick={onClose}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [query, setQuery] = useState("");
  const { data, isLoading, error } = useUsers(includeInactive);
  const reset = useResetPassword();
  const [editing, setEditing] = useState<User | "new" | null>(null);
  const [temp, setTemp] = useState<TempPassword | null>(null);

  const q = query.trim().toLowerCase();
  const users = (data ?? []).filter(
    (u) => !q || `${u.name} ${u.email} ${u.department} ${u.position}`.toLowerCase().includes(q),
  );

  const handleReset = (u: User) => {
    if (!window.confirm(`${u.name}님의 비밀번호를 초기화할까요? (잠금도 해제됩니다)`)) return;
    reset.mutate(u.id, {
      onSuccess: (res) => setTemp({ name: u.name, email: u.email, pw: res.tempPassword }),
      onError: (e) => window.alert(e.message),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="설정"
        title="사용자"
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus strokeWidth={2} /> 사용자 등록
          </Button>
        }
      />
      <Card aria-label="사용자 목록">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="이름, 이메일, 소속 검색"
            className="min-w-64"
          />
          <label className="flex min-h-11 items-center gap-2 text-[13px] text-sub">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="size-4 accent-ink"
            />
            비활성 사용자 포함
          </label>
        </div>
        <Table className="min-w-[880px]">
          <TableHeader>
            <tr>
              <TableHead>사용자</TableHead>
              <TableHead>소속</TableHead>
              <TableHead>권한</TableHead>
              <TableHead>최근 로그인</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {isLoading && <TableMessage colSpan={5}>불러오는 중...</TableMessage>}
            {error && (
              <TableMessage colSpan={5} tone="error">
                {error.message}
              </TableMessage>
            )}
            {data && users.length === 0 && (
              <TableMessage colSpan={5}>해당하는 사용자가 없습니다.</TableMessage>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className={cn("flex items-center gap-3", !u.isActive && "opacity-55")}>
                    <Avatar userId={u.id} name={u.name} />
                    <div className="flex flex-col leading-snug">
                      <span className="font-semibold">
                        {u.name}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          {u.position}
                        </span>
                        {!u.isActive && (
                          <span className="text-xs font-normal text-muted-foreground">
                            {" "}
                            · 비활성
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-ink-soft">{u.department || "—"}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
                      u.role === "ADMIN" ? "bg-ink text-white" : "bg-[#f0efeb] text-sub",
                    )}
                  >
                    {u.role === "ADMIN" ? "관리자" : "구성원"}
                  </span>
                </TableCell>
                <TableCell className="num text-xs whitespace-nowrap text-muted-foreground">
                  {u.lastLoginAt ? formatKstDateTime(u.lastLoginAt).slice(5) : "—"}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
                    수정
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleReset(u)}>
                    비밀번호 초기화
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {editing && (
        <UserDialog
          key={editing === "new" ? "new" : editing.id}
          user={editing}
          onClose={() => setEditing(null)}
          onTempPassword={setTemp}
        />
      )}
      <TempPasswordDialog temp={temp} onClose={() => setTemp(null)} />
    </>
  );
}
