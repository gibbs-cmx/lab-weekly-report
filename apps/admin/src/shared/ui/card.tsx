import * as React from "react";

import { cn } from "@/shared/lib/utils";

/** 기본 표면 — 흰 배경 + 1px 라인 + 16px 라운드 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Card };
