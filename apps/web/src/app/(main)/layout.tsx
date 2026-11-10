"use client";

import { History, PenLine } from "lucide-react";

import { AuthProvider } from "@/shared/auth/auth-context";
import { Sidebar, type NavSection } from "@/widgets/layout/ui/sidebar";

const NAV: NavSection[] = [
  {
    items: [
      { href: "/", label: "주간보고 작성", icon: PenLine },
      { href: "/history", label: "내 보고서", icon: History },
    ],
  },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-dvh flex-col md:flex-row">
        <Sidebar tone="light" subtitle="Research Lab" sections={NAV} />
        <main className="min-w-0 flex-1 px-5 py-8 md:px-12 md:py-10">
          <div className="mx-auto flex max-w-[1160px] flex-col gap-7">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
