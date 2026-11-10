"use client";

import { ChartColumn, FolderClosed, LayoutDashboard, Users } from "lucide-react";

import { AuthProvider } from "@/shared/auth/auth-context";
import { Sidebar, type NavSection } from "@/widgets/layout/ui/sidebar";

const NAV: NavSection[] = [
  {
    label: "보고",
    items: [
      { href: "/", label: "제출 현황", icon: LayoutDashboard },
      { href: "/participation", label: "통계", icon: ChartColumn },
    ],
  },
  {
    label: "설정",
    items: [
      { href: "/projects", label: "프로젝트", icon: FolderClosed },
      { href: "/users", label: "사용자", icon: Users },
    ],
  },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh flex-col md:flex-row">
        <Sidebar tone="dark" subtitle="관리자" sections={NAV} />
        <main className="min-w-0 flex-1 px-5 py-8 md:px-12 md:py-10">
          <div className="mx-auto flex max-w-[1160px] flex-col gap-6">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
