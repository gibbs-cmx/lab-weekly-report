"use client";

import { KeyRound, LogOut, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/shared/auth/auth-context";
import { cn } from "@/shared/lib/utils";

export interface NavSection {
  /** 섹션 라벨 (없으면 라벨 없이 나열) */
  label?: string;
  items: { href: string; label: string; icon: LucideIcon }[];
}

interface SidebarProps {
  /** light = 구성원 앱(종이색), dark = 관리자 앱(잉크) */
  tone: "light" | "dark";
  subtitle: string;
  sections: NavSection[];
}

const TONES = {
  light: {
    root: "border-line bg-paper-soft text-ink max-md:border-b md:border-r",
    logo: "bg-ink text-paper",
    sub: "text-muted-foreground",
    section: "text-muted-foreground",
    item: "text-sub hover:bg-track hover:text-ink",
    active: "bg-ink font-medium text-white",
    card: "border border-line bg-white",
    avatar: "bg-[#e9ecfb] text-cobalt",
    action: "text-muted-foreground hover:bg-track hover:text-ink",
  },
  dark: {
    root: "bg-side text-[#e9e8e4]",
    logo: "bg-paper text-ink",
    sub: "text-side-dim",
    section: "text-[#8a8d93]",
    item: "text-side-text hover:bg-side-raised hover:text-white",
    active: "bg-side-active font-medium text-white",
    card: "bg-side-raised",
    avatar: "bg-[#33363c] text-white",
    action: "text-side-dim hover:bg-side-active hover:text-white",
  },
} as const;

const actionClass =
  "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-sm text-xs transition-colors max-md:size-11 max-md:flex-none";

export function Sidebar({ tone, subtitle, sections }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const t = TONES[tone];

  return (
    <aside
      className={cn(
        "flex shrink-0 gap-3 px-4 py-3 max-md:flex-wrap max-md:items-center md:sticky md:top-0 md:h-dvh md:w-[232px] md:flex-col md:gap-8 md:px-5 md:py-7",
        t.root,
      )}
    >
      <div className="flex items-center gap-2.5 md:px-2">
        <div
          className={cn(
            "flex size-[30px] items-center justify-center rounded-sm text-sm font-bold",
            t.logo,
          )}
        >
          W
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">주간보고</span>
          <span className={cn("text-xs", t.sub)}>{subtitle}</span>
        </div>
      </div>

      <nav
        aria-label="주 메뉴"
        className="flex gap-0.5 max-md:order-last max-md:w-full max-md:overflow-x-auto md:flex-col"
      >
        {sections.map((section, si) => (
          <div key={section.label ?? si} className="flex gap-0.5 md:flex-col">
            {section.label && (
              <span
                className={cn(
                  "px-3 pb-1.5 text-[11px] font-semibold tracking-[0.08em] max-md:hidden",
                  si > 0 && "md:pt-[18px]",
                  t.section,
                )}
              >
                {section.label}
              </span>
            )}
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm whitespace-nowrap transition-colors md:min-h-10",
                    active ? t.active : t.item,
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "ml-auto flex gap-2.5 rounded-lg max-md:items-center max-md:border-0 max-md:bg-transparent md:mt-auto md:ml-0 md:flex-col md:p-3",
          t.card,
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5 max-md:hidden">
          <div
            aria-hidden="true"
            className={cn(
              "flex size-[34px] shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
              t.avatar,
            )}
          >
            {user?.name.slice(0, 1)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[13px] font-semibold">{user?.name}</span>
            <span className={cn("truncate text-xs", t.sub)}>
              {[user?.department, user?.position].filter(Boolean).join(" · ") || user?.email}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <Link href="/change-password" className={cn(actionClass, t.action)}>
            <KeyRound className="size-3.5" strokeWidth={1.8} />
            <span className="max-md:sr-only">비밀번호</span>
          </Link>
          <button type="button" onClick={logout} className={cn(actionClass, t.action)}>
            <LogOut className="size-3.5" strokeWidth={1.8} />
            <span className="max-md:sr-only">로그아웃</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
