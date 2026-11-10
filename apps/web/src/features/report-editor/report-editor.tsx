"use client";

import {
  addDays,
  MAX_ITEM_RATE,
  REQUIRED_TOTAL_RATE,
  sumParticipation,
  validateReportItems,
} from "@wr/shared";
import { Check, CopyPlus, Minus, Plus, Trash2 } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { api } from "@/shared/api/api";
import { useSaveReport } from "@/shared/api/queries";
import type { Project, Report, SaveReportInput } from "@/shared/api/types";
import { projectColor } from "@/shared/lib/project-color";
import { cn, formatKstDateTime } from "@/shared/lib/utils";
import { AllocationBar } from "@/shared/ui/allocation-bar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

interface ItemState {
  key: number;
  projectId: number | null;
  participationRate: string;
  doneText: string;
  planText: string;
}

let keySeq = 0;
const newItem = (partial: Partial<ItemState> = {}): ItemState => ({
  key: ++keySeq,
  projectId: null,
  participationRate: "",
  doneText: "",
  planText: "",
  ...partial,
});

function fromReport(report: Report | null): ItemState[] {
  if (!report || report.items.length === 0) return [newItem()];
  return report.items.map((it) =>
    newItem({
      projectId: it.projectId,
      participationRate: String(it.participationRate),
      doneText: it.doneText,
      planText: it.planText,
    }),
  );
}

const NO_PROJECT_COLOR = "#CFCDC6";
const areaClass =
  "field-sizing-content min-h-12 w-full resize-none border-0 bg-transparent p-0 text-sm leading-[1.7] text-ink outline-none placeholder:text-faint disabled:text-ink-soft";
const cellClass =
  "flex flex-col gap-2 px-6 py-5 transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_var(--color-cobalt)]";

/** 내용 길이에 맞춰 높이가 늘어나는 textarea. CSS field-sizing 미지원 브라우저(Firefox 등)만 JS 로 보정 */
function AutoTextarea(props: React.ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || CSS.supports("field-sizing", "content")) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} {...props} />;
}

function CheckRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2", ok ? "text-ink-soft" : "text-muted-foreground")}>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-full",
          ok ? "bg-ok-bg text-ok" : "bg-track text-faint",
        )}
      >
        {ok ? (
          <Check className="size-[11px]" strokeWidth={3} />
        ) : (
          <Minus className="size-[11px]" strokeWidth={3} />
        )}
      </span>
      {children}
      <span className="sr-only">{ok ? " (완료)" : " (미완료)"}</span>
    </li>
  );
}

interface ReportEditorProps {
  week: string;
  report: Report | null;
  projects: Project[];
}

export function ReportEditor({ week, report, projects }: ReportEditorProps) {
  const [items, setItems] = useState<ItemState[]>(() => fromReport(report));
  const [note, setNote] = useState(report?.note ?? "");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [copying, setCopying] = useState(false);
  const save = useSaveReport();
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      note: (report?.note ?? "").trim(),
      items: (report?.items ?? []).map((it) => ({
        projectId: it.projectId,
        participationRate: it.participationRate,
        doneText: it.doneText,
        planText: it.planText,
      })),
    }),
  );

  const submitted = report?.status === "SUBMITTED";

  // 종료된 프로젝트가 기존 보고서에 남아 있으면 선택지에 표시 (선택 불가)
  const projectOptions = useMemo(() => {
    const map = new Map(
      projects.map((p) => [p.id, { id: p.id, name: p.name, code: p.code, disabled: false }]),
    );
    report?.items.forEach((it) => {
      if (!map.has(it.projectId)) {
        map.set(it.projectId, {
          id: it.projectId,
          name: `${it.projectName} (종료)`,
          code: it.projectCode,
          disabled: true,
        });
      }
    });
    return map;
  }, [projects, report]);

  const selected = items.filter((it) => it.projectId !== null);
  const input: SaveReportInput = {
    weekStart: week,
    note,
    items: selected.map((it) => ({
      projectId: it.projectId as number,
      participationRate: Number(it.participationRate),
      doneText: it.doneText,
      planText: it.planText,
    })),
  };
  const total = sumParticipation(input.items);
  const submitErrors = validateReportItems(input.items, { forSubmit: true });
  const hasUnselected = items.some(
    (it) => it.projectId === null && (it.doneText || it.planText || it.participationRate),
  );
  const allDone = selected.length > 0 && selected.every((it) => it.doneText.trim());
  const canSubmit = submitErrors.length === 0 && !hasUnselected;
  // 마지막으로 저장된 내용과 다른지 (빈 항목은 비교에서 제외)
  const snapshot = JSON.stringify({ note: note.trim(), items: input.items });
  const dirty = snapshot !== savedSnapshot;
  const remaining = REQUIRED_TOTAL_RATE - total;

  const update = (key: number, patch: Partial<ItemState>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  /** 항목 추가 후 새 카드가 보이도록 스크롤 (추가 버튼은 목록 위·아래 양쪽에 있음) */
  const addRowRef = useRef<HTMLDivElement>(null);
  const addItem = () => {
    setItems((prev) => [...prev, newItem()]);
    requestAnimationFrame(() =>
      addRowRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    );
  };

  const remove = (key: number) =>
    setItems((prev) => (prev.length === 1 ? [newItem()] : prev.filter((it) => it.key !== key)));

  /** 지난주 보고서의 프로젝트/참여율 + "다음 주 계획"을 이번 주 "수행 내용"으로 가져오기 */
  const copyLastWeek = async () => {
    setCopying(true);
    setMessage(null);
    try {
      const prev = await api.getMyWeek(addDays(week, -7));
      if (!prev || prev.items.length === 0) {
        setMessage({ type: "error", text: "지난주 보고서가 없습니다." });
        return;
      }
      const activeIds = new Set(projects.map((p) => p.id));
      const copied = prev.items
        .filter((it) => activeIds.has(it.projectId))
        .map((it) =>
          newItem({
            projectId: it.projectId,
            participationRate: String(it.participationRate),
            doneText: it.planText,
          }),
        );
      setItems(copied.length > 0 ? copied : [newItem()]);
      setMessage({ type: "ok", text: "지난주 내용을 불러왔습니다. 확인 후 수정해주세요." });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "불러오기 실패" });
    } finally {
      setCopying(false);
    }
  };

  const handleSave = (submit: boolean) => {
    setMessage(null);
    const resubmit = submitted;
    save.mutate(
      { input, submit },
      {
        onSuccess: () => {
          setSavedSnapshot(snapshot);
          setMessage({
            type: "ok",
            text: !submit
              ? "임시저장되었습니다."
              : resubmit
                ? "수정 내용을 다시 제출했습니다."
                : "제출되었습니다.",
          });
        },
        onError: (e) => setMessage({ type: "error", text: e.message }),
      },
    );
  };

  return (
    <div className="flex flex-wrap items-start gap-7">
      {/* ── 항목 ─────────────────────────────────────────────── */}
      <section
        aria-label="프로젝트별 보고"
        className="flex min-w-0 flex-[999_1_520px] flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-sub">
            이번 주 업무{" "}
            <span className="num font-medium text-muted-foreground">{items.length}</span>
          </span>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus strokeWidth={2} /> 업무 추가
          </Button>
        </div>
        {items.map((it, idx) => {
          const project = it.projectId !== null ? projectOptions.get(it.projectId) : undefined;
          const color = it.projectId !== null ? projectColor(it.projectId) : NO_PROJECT_COLOR;
          const rate = Math.max(0, Math.min(Number(it.participationRate) || 0, 100));
          return (
            <Card key={it.key} role="group" aria-label={`업무 ${idx + 1}`}>
              <div className="flex items-center gap-3 border-b border-line-soft py-4 pr-3 pl-6 sm:gap-4">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: color }}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <select
                    aria-label="프로젝트"
                    value={it.projectId ?? ""}
                    onChange={(e) =>
                      update(it.key, { projectId: e.target.value ? Number(e.target.value) : null })
                    }
                    className={cn(
                      "-ml-1 h-7 w-full min-w-0 cursor-pointer truncate rounded-sm border-0 bg-transparent px-1 text-[15px] font-semibold outline-none focus-visible:ring-4 focus-visible:ring-cobalt/12 disabled:cursor-default disabled:opacity-100",
                      it.projectId === null && "text-muted-foreground",
                    )}
                  >
                    <option value="">프로젝트 선택</option>
                    {[...projectOptions.values()].map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={
                          p.disabled || items.some((o) => o.key !== it.key && o.projectId === p.id)
                        }
                      >
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <span className="num text-xs text-muted-foreground">{project?.code ?? "—"}</span>
                </div>
                <label className="flex h-11 shrink-0 items-center gap-1 rounded-md border border-[#e2e0da] bg-paper-soft pr-3 pl-3 transition-[border-color,box-shadow] focus-within:border-cobalt focus-within:ring-4 focus-within:ring-cobalt/12">
                  <span className="sr-only">참여율 (%)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_ITEM_RATE}
                    step={5}
                    placeholder="0"
                    value={it.participationRate}
                    onChange={(e) => update(it.key, { participationRate: e.target.value })}
                    className="num w-12 [appearance:textfield] border-0 bg-transparent text-right text-xl font-medium outline-none placeholder:text-faint [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </label>
                {
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 text-[#8c9097]"
                    onClick={() => remove(it.key)}
                    aria-label={`업무 ${idx + 1} 삭제`}
                  >
                    <Trash2 strokeWidth={1.8} />
                  </Button>
                }
              </div>
              <div aria-hidden="true" className="h-[3px] bg-track">
                <div
                  className="h-[3px] transition-[width]"
                  style={{ width: `${rate}%`, background: color }}
                />
              </div>
              <div className="grid md:grid-cols-2">
                <label className={cn(cellClass, "border-line-soft max-md:border-b md:border-r")}>
                  <span className="text-xs font-semibold text-sub">이번 주 수행 내용</span>
                  <AutoTextarea
                    value={it.doneText}
                    placeholder="- 수행한 일을 항목별로 적어주세요"
                    onChange={(e) => update(it.key, { doneText: e.target.value })}
                    className={areaClass}
                  />
                </label>
                <label className={cn(cellClass, "bg-[#fcfbf9]")}>
                  <span className="text-xs font-semibold text-sub">다음 주 계획</span>
                  <AutoTextarea
                    value={it.planText}
                    onChange={(e) => update(it.key, { planText: e.target.value })}
                    className={areaClass}
                  />
                </label>
              </div>
            </Card>
          );
        })}

        {
          <div ref={addRowRef} className="flex scroll-mb-6 flex-wrap gap-2.5">
            <Button
              variant="dashed"
              className="h-[52px] flex-[1_1_240px] rounded-[14px]"
              onClick={addItem}
            >
              <Plus strokeWidth={2} /> 업무 추가
            </Button>
            {!report && (
              <Button
                variant="outline"
                className="h-[52px] rounded-[14px] px-5 font-normal text-sub"
                onClick={copyLastWeek}
                disabled={copying}
              >
                <CopyPlus strokeWidth={1.8} /> 지난주 불러오기
              </Button>
            )}
          </div>
        }

        <Card>
          <label className={cellClass}>
            <span className="text-xs font-semibold text-sub">이슈 · 건의 · 기타</span>
            <AutoTextarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={areaClass}
            />
          </label>
        </Card>
      </section>

      {/* ── 요약 ─────────────────────────────────────────────── */}
      <aside
        aria-label="이번 주 요약"
        className="sticky top-6 flex flex-[1_1_300px] flex-col gap-4 self-start"
      >
        <Card className="flex flex-col gap-5 p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-sub">참여율 배분</span>
            <span
              className={cn(
                "text-xs font-semibold",
                remaining === 0 ? "text-ok" : remaining < 0 ? "text-bad-fg" : "text-warn-fg",
              )}
            >
              {remaining === 0
                ? "합계 완료"
                : remaining < 0
                  ? `${-remaining}% 초과`
                  : `${remaining}% 남음`}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="num text-5xl leading-none font-medium tracking-[-0.03em]">
              {total}
            </span>
            <span className="text-lg text-muted-foreground">/ {REQUIRED_TOTAL_RATE}%</span>
          </div>
          <AllocationBar
            className="h-3"
            segments={input.items.map((i) => ({
              projectId: i.projectId,
              rate: i.participationRate || 0,
            }))}
          />
          {selected.length > 0 && (
            <ul className="flex flex-col gap-2.5">
              {selected.map((it) => (
                <li key={it.key} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-[2px]"
                    style={{ background: projectColor(it.projectId as number) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-ink-soft">
                    {projectOptions.get(it.projectId as number)?.name}
                  </span>
                  <span className="num font-medium">{Number(it.participationRate) || 0}%</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-3.5 p-6">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold text-sub">
              {submitted ? "제출 완료" : "제출 전 확인"}
            </span>
            {submitted && (
              <span className="num text-xs text-muted-foreground">
                {formatKstDateTime(report?.submittedAt)}
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-2.5 text-[13px]">
            <CheckRow ok={remaining === 0}>참여율 합계 {REQUIRED_TOTAL_RATE}%</CheckRow>
            <CheckRow ok={allDone}>모든 프로젝트 수행 내용 입력</CheckRow>
            {hasUnselected && <CheckRow ok={false}>프로젝트를 선택하지 않은 항목이 있음</CheckRow>}
          </ul>
          <Button
            size="lg"
            className="mt-1.5"
            onClick={() => handleSave(true)}
            disabled={save.isPending || !canSubmit || (submitted && !dirty)}
          >
            {submitted ? "수정 내용 다시 제출" : "제출하기"}
          </Button>
          {!submitted && (
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={save.isPending || !dirty}
            >
              임시저장
            </Button>
          )}
          <span className="text-center text-xs text-muted-foreground">
            {submitted
              ? dirty
                ? "수정한 내용이 아직 제출되지 않았습니다."
                : "제출 후에도 내용을 고쳐 다시 제출할 수 있습니다."
              : report
                ? `마지막 저장 ${formatKstDateTime(report.updatedAt)}`
                : "아직 저장하지 않았습니다."}
          </span>
          {message && (
            <p
              role="status"
              className={cn(
                "rounded-md px-3.5 py-2.5 text-[13px] whitespace-pre-line",
                message.type === "ok" ? "bg-ok-bg text-ok-fg" : "bg-bad-bg text-bad-fg",
              )}
            >
              {message.text}
            </p>
          )}
        </Card>
      </aside>
    </div>
  );
}
