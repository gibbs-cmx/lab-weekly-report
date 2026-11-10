"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

/** 엑셀 내보내기 버튼 — 생성 중 표시와 실패 알림을 처리 */
export function ExportButton({
  onExport,
  disabled,
}: {
  onExport: () => Promise<void>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await onExport();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "엑셀 파일을 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-10 px-3.5"
      onClick={run}
      disabled={busy || disabled}
    >
      {busy ? <Loader2 className="animate-spin" /> : <Download strokeWidth={1.8} />}
      엑셀
    </Button>
  );
}
