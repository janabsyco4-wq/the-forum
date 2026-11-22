import Link from "next/link";
import { ArrowRight, FileClock, FileText, Flag, Gavel, MessagesSquare, Users } from "lucide-react";
import { formatNumber, lt, timeAgo } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { categoryMap, userMap } from "@/lib/data/helpers";
import { WeeklyChart } from "@/components/admin/WeeklyChart";
import { AdminAction } from "@/components/admin/AdminAction";
import { Badge } from "@/components/ui/primitives";
import { requireStaff } from "@/lib/guard";
import { categoryTone } from "@/lib/ui/tones";

export default async function AdminOverview({ params }: { params: Promise<{ lang: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  await requireStaff(locale, "C:/Program Files/Git/admin");
  const t = dict.admin;
  const data = await getData();
  const [stats, pending, reports, cats] = await Promise.all([
    data.getAdminStats(),
    data.listArticles({ status: "pending", pageSize: 5 }),
    data.listReports({ status: "open" }),
    categoryMap(data),
  ]);
  const authors = await userMap(data, pending.items.map((a) => a.authorId));
  const n = (x: number) => formatNumber(x, locale);
  const tiles = [
    { k: "users", icon: Users, v: stats.totals.users },
    { k: "articles", icon: FileText, v: stats.totals.articles },
    { k: "pendingArticles", icon: FileClock, v: stats.totals.pendingArticles, warn: true },
    { k: "openReports", icon: Flag, v: stats.totals.openReports, warn: true },
    { k: "activeDebates", icon: Gavel, v: stats.totals.activeDebates },
    { k: "discussions", icon: MessagesSquare, v: stats.totals.discussions },
  ] as const;
  const maxCat = Math.max(...stats.topCategories.map((c) => c.articles), 1);
  const maxUni = Math.max(...stats.topUniversities.map((u) => u.members), 1);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-6">
        {tiles.map((s, i) => (
          <div key={s.k} className={`tone-${(["indigo", "emerald", "amber", "rose", "violet", "cyan"] as const)[i]} card relative overflow-hidden p-4 sm:p-5`}>
            <span className="pointer-events-none absolute -end-6 -top-6 h-20 w-20 rounded-full t-soft" />
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl t-pill">
              <s.icon className="h-4 w-4" />
            </span>
            <p className="relative mt-3 font-display text-2xl t-text sm:mt-4 sm:text-3xl">{n(s.v)}</p>
            <p className="relative mt-0.5 text-xs text-muted">{t.totals[s.k]}</p>
          </div>
        ))}
      </div>

      <section className="card overflow-x-auto p-4 sm:p-6">
        <h2 className="mb-4 font-display text-xl text-ink">{t.weekly}</h2>
        <WeeklyChart weekly={stats.weekly} labels={{ signups: t.signups, articles: t.newArticles, arguments: t.newArguments }} locale={locale} />
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">{t.reviewQueue}</h2>
            <Link href={href(locale, "/admin/articles")} className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
              {dict.common.viewAll} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {pending.items.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{a.title}</p>
                  <p className="text-xs text-muted">
                    {authors.get(a.authorId)?.name} · {lt(cats.get(a.category)?.name ?? { en: a.category }, locale)} · {timeAgo(a.createdAt, locale)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <AdminAction endpoint="PATCH /api/admin/articles/:id" params={{ id: a.id }} body={{ status: "published" }} label={t.approve} tone="primary" />
                  <AdminAction endpoint="PATCH /api/admin/articles/:id" params={{ id: a.id }} body={{ status: "rejected" }} label={t.reject} tone="danger" />
                </div>
              </li>
            ))}
            {pending.items.length === 0 && <li className="py-4 text-sm text-muted">{dict.common.noResults}</li>}
          </ul>
        </section>

        <section className="card p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">{t.reports}</h2>
            <Link href={href(locale, "/admin/reports")} className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
              {dict.common.viewAll} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {reports.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-center gap-2">
                  <Badge tone="danger">{dict.report.reasons[r.reason]}</Badge>
                  <span className="text-xs text-muted">{r.targetType} · {timeAgo(r.createdAt, locale)}</span>
                </div>
                <p className="mt-2 text-sm text-ink-2 line-clamp-1">“{r.targetPreview}”</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4 sm:p-6">
          <h2 className="mb-5 font-display text-xl text-ink">{t.topCategories}</h2>
          <ul className="space-y-3">
            {stats.topCategories.map((c) => (
              <li key={c.slug}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink-2">{lt(cats.get(c.slug)?.name ?? { en: c.slug }, locale)}</span>
                  <span className="text-muted">{n(c.articles)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2">
                  <div className={`tone-${categoryTone(c.slug)} h-full rounded-full t-dot`} style={{ width: `${(c.articles / maxCat) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4 sm:p-6">
          <h2 className="mb-5 font-display text-xl text-ink">{t.topUniversities}</h2>
          <ul className="space-y-3">
            {stats.topUniversities.map((u) => (
              <li key={u.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink-2">{u.name}</span>
                  <span className="text-muted">{n(u.members)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(u.members / maxUni) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
