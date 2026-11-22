"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, Flag, Gavel, Users } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { href } from "@/i18n/config";

export function AdminNav() {
  const { dict, locale } = useI18n();
  const pathname = usePathname();
  const items = [
    { path: "/admin", label: dict.admin.overview, icon: BarChart3, tone: "indigo" },
    { path: "/admin/users", label: dict.admin.users, icon: Users, tone: "emerald" },
    { path: "/admin/articles", label: dict.admin.content, icon: FileText, tone: "violet" },
    { path: "/admin/debates", label: dict.admin.debates, icon: Gavel, tone: "rose" },
    { path: "/admin/reports", label: dict.admin.reports, icon: Flag, tone: "amber" },
  ];
  return (
    <nav aria-label={dict.admin.title} className="scroll-row lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
      {items.map((i) => {
        const full = href(locale, i.path);
        const active = pathname === full;
        return (
          <Link
            key={i.path}
            href={full}
            aria-current={active ? "page" : undefined}
            className={`tone-${i.tone} flex shrink-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${active ? "t-fill border-transparent shadow-soft" : "border-line bg-surface text-muted hover:text-ink lg:border-transparent lg:bg-transparent lg:hover:bg-surface-2"}`}
          >
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${active ? "bg-white/20" : "t-soft t-text"}`}>
              <i.icon className="h-3.5 w-3.5" />
            </span>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
