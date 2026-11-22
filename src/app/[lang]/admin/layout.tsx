import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { isPrototypeData } from "@/lib/data";
import { requireUser } from "@/lib/guard";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  // With a real database, only moderators and admins may enter.
  const me = await requireUser(locale, "/admin");
  if (!isPrototypeData && me && me.role !== "admin" && me.role !== "moderator") redirect(href(locale, "/dashboard"));

  return (
    <div className="container-page py-6 md:py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-2 inline-flex items-center gap-1.5 tone-rose">
            <ShieldCheck className="h-3.5 w-3.5" /> {dict.admin.title}
          </p>
          <h1 className="font-display text-3xl text-ink md:text-4xl">
            <span className="text-gradient">{dict.brand.name}</span> · {dict.admin.overview}
          </h1>
        </div>
        {isPrototypeData && <p className="max-w-md rounded-xl border border-warning/30 bg-warning-soft px-4 py-2.5 text-xs leading-relaxed text-warning">{dict.admin.prototypeNote}</p>}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="min-w-0 lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <AdminNav />
          </div>
        </aside>
        <div className="min-w-0 lg:col-span-10">{children}</div>
      </div>
    </div>
  );
}
