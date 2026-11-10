export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  /** 제목 위 작은 라벨 (예: "2026 · 46주차") */
  eyebrow?: string;
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
