"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { useDeleteProject, useProjects, useSaveProject } from "@/shared/api/queries";
import type { Project, ProjectInput } from "@/shared/api/types";
import { projectColor, projectTint } from "@/shared/lib/project-color";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Segmented } from "@/shared/ui/segmented";
import { Textarea } from "@/shared/ui/textarea";
import { PageHeader } from "@/widgets/layout/ui/page-header";

type Filter = "ACTIVE" | "CLOSED" | "ALL";
type Status = NonNullable<ProjectInput["status"]>;

const EMPTY: ProjectInput = {
  code: "",
  name: "",
  description: "",
  status: "ACTIVE",
  startDate: "",
  endDate: "",
};

/** "2026-03-01" → "2026.03" */
const ym = (d: string | null) => (d ? d.slice(0, 7).replace("-", ".") : "");

function ProjectPanel({ project, onClose }: { project: Project | "new"; onClose: () => void }) {
  const editing = project !== "new" ? project : null;
  const [form, setForm] = useState<ProjectInput>(() =>
    editing
      ? { ...editing, startDate: editing.startDate ?? "", endDate: editing.endDate ?? "" }
      : EMPTY,
  );
  const [error, setError] = useState("");
  const save = useSaveProject();
  const remove = useDeleteProject();
  const set = (patch: Partial<ProjectInput>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const input: ProjectInput = {
      code: form.code,
      name: form.name,
      description: form.description,
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    };
    save.mutate(
      { id: editing?.id, input },
      { onSuccess: onClose, onError: (err) => setError(err.message) },
    );
  };

  const handleDelete = () => {
    if (!editing || !window.confirm(`'${editing.name}' 프로젝트를 삭제할까요?`)) return;
    setError("");
    remove.mutate(editing.id, { onSuccess: onClose, onError: (err) => setError(err.message) });
  };

  return (
    <Card
      aria-label={editing ? "프로젝트 수정" : "프로젝트 등록"}
      role="region"
      className="flex-[1_1_340px] lg:sticky lg:top-10"
    >
      <div className="flex items-center justify-between border-b border-line-soft py-3 pr-3 pl-6">
        <h2 className="text-[15px] font-semibold">{editing ? "프로젝트 수정" : "프로젝트 등록"}</h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label="닫기"
          className="text-[#8c9097]"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 pt-5 pb-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-code">과제 코드</Label>
          <Input
            id="p-code"
            value={form.code}
            onChange={(e) => set({ code: e.target.value })}
            className="num"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-name">프로젝트명</Label>
          <Input
            id="p-name"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="p-desc">설명</Label>
          <Textarea
            id="p-desc"
            rows={2}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-start">시작일</Label>
            <Input
              id="p-start"
              type="date"
              value={form.startDate ?? ""}
              onChange={(e) => set({ startDate: e.target.value })}
              className="num text-[13px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="p-end">종료일</Label>
            <Input
              id="p-end"
              type="date"
              value={form.endDate ?? ""}
              onChange={(e) => set({ endDate: e.target.value })}
              className="num text-[13px]"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>상태</Label>
          <Segmented<Status>
            label="상태"
            value={form.status ?? "ACTIVE"}
            onChange={(status) => set({ status })}
            className="flex"
            options={[
              { value: "ACTIVE", label: "진행중" },
              { value: "CLOSED", label: "종료" },
            ]}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-bad-bg px-3.5 py-2.5 text-[13px] text-bad-fg">
            {error}
          </p>
        )}
        <div className="mt-2 flex gap-2">
          {editing && (
            <Button
              type="button"
              variant="danger"
              className="px-3.5 text-[13px]"
              onClick={handleDelete}
              disabled={remove.isPending}
            >
              삭제
            </Button>
          )}
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={save.isPending}>
            저장
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          주간보고에 사용된 프로젝트는 삭제할 수 없습니다. 끝난 과제는 &lsquo;종료&rsquo;로
          바꿔주세요.
        </p>
      </form>
    </Card>
  );
}

export default function ProjectsPage() {
  const { data, isLoading, error } = useProjects();
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const [editing, setEditing] = useState<Project | "new" | null>(null);

  const count = (s: Status) => data?.filter((p) => p.status === s).length ?? 0;
  const list = data?.filter((p) => filter === "ALL" || p.status === filter) ?? [];
  const editingId = editing && editing !== "new" ? editing.id : null;

  return (
    <>
      <PageHeader
        eyebrow="설정"
        title="프로젝트"
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus strokeWidth={2} /> 프로젝트 등록
          </Button>
        }
      />
      <div className="flex flex-wrap items-start gap-6">
        <Card aria-label="프로젝트 목록" className="min-w-0 flex-[999_1_520px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
            <Segmented<Filter>
              label="상태 필터"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "ACTIVE", label: `진행중 ${count("ACTIVE")}` },
                { value: "CLOSED", label: `종료 ${count("CLOSED")}` },
                { value: "ALL", label: "전체" },
              ]}
            />
            <span className="text-xs text-muted-foreground">
              진행중 프로젝트만 구성원이 선택할 수 있습니다
            </span>
          </div>
          {isLoading && (
            <p className="px-6 py-10 text-center text-muted-foreground">불러오는 중...</p>
          )}
          {error && <p className="px-6 py-10 text-center text-bad-fg">{error.message}</p>}
          {data && list.length === 0 && (
            <p className="px-6 py-10 text-center text-muted-foreground">
              해당하는 프로젝트가 없습니다.
            </p>
          )}
          <ul>
            {list.map((p) => {
              const active = p.status === "ACTIVE";
              return (
                <li key={p.id} className="border-t border-line-soft first:border-t-0">
                  <button
                    type="button"
                    aria-label={`${p.name} 수정`}
                    aria-pressed={editingId === p.id}
                    onClick={() => setEditing(p)}
                    className={cn(
                      "flex w-full items-center gap-4 px-5 py-[18px] text-left transition-colors outline-none hover:bg-paper-soft focus-visible:bg-paper-soft",
                      editingId === p.id && "bg-[#fafaf7]",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-md"
                      style={{ background: active ? projectTint(p.id) : "#F0EFEB" }}
                    >
                      <span
                        className="size-3 rounded-[4px]"
                        style={{ background: active ? projectColor(p.id) : "#8C9097" }}
                      />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-snug">
                      <span
                        className={cn(
                          "text-[15px] font-semibold",
                          !active && "text-muted-foreground",
                        )}
                      >
                        {p.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        <span className="num">{p.code}</span>
                        {p.description ? ` · ${p.description}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={cn(
                          "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
                          active ? "bg-[#e9ecfb] text-[#2340b8]" : "bg-[#f0efeb] text-[#5e6168]",
                        )}
                      >
                        {active ? "진행중" : "종료"}
                      </span>
                      <span className="num text-xs text-muted-foreground">
                        {p.startDate || p.endDate
                          ? `${ym(p.startDate)} – ${ym(p.endDate)}`
                          : "상시"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {editing && (
          <ProjectPanel
            key={editing === "new" ? "new" : editing.id}
            project={editing}
            onClose={() => setEditing(null)}
          />
        )}
      </div>
    </>
  );
}
