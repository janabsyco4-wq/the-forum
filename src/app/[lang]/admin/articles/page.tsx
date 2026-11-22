import Link from "next/link";
import type { Article, ArticleStatus } from "@/types/domain";
import { formatDate, formatNumber, lt } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { categoryMap, userMap } from "@/lib/data/helpers";
import { categoryTone } from "@/lib/ui/tones";
import { Badge, ChipRow } from "@/components/ui/primitives";
import { requireStaff } from "@/lib/guard";
import { AdminAction } from "@/components/admin/AdminAction";

const TABS: ArticleStatus[] = ["pending", "published", "rejected", "archived"];
const TAB_TONE = { pending: "amber", published: "emerald", rejected: "rose", archived: "slate", draft: "slate" } as const;

export default async function AdminArticles({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ status?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  await requireStaff(locale, "C:/Program Files/Git/admin/articles");
  const t = dict.admin;
  const sp = await searchParams;
  const status = TABS.includes(sp.status as ArticleStatus) ? (sp.status as ArticleStatus) : "pending";
  const data = await getData();
  const [res, cats] = await Promise.all([data.listArticles({ status, pageSize: 50 }), categoryMap(data)]);
  const authors = await userMap(data, res.items.map((a) => a.authorId));

  const actions = (a: Article) => (
    <>
      {a.status === "pending" && (
        <>
          <AdminAction endpoint="PATCH /api/admin/articles/:id" params={{ id: a.id }} body={{ status: "published" }} label={t.approve} tone="primary" />
          <AdminAction endpoint="PATCH /api/admin/articles/:id" params={{ id: a.id }} body={{ status: "rejected" }} label={t.reject} tone="danger" />
        </>
      )}
      {a.status === "published" && (
        <>
          <AdminAction endpoint="PATCH /api/admin/articles/:id" params={{ id: a.id }} body={{ featured: !a.featured }} label={a.featured ? t.unfeature : t.feature} />
          <AdminAction endpoint="PATCH /api/admin/articles/:id" params={{ id: a.id }} body={{ status: "archived" }} label={t.hide} tone="danger" />
        </>
      )}
      {(a.status === "rejected" || a.status === "archived") && (
        <AdminAction endpoint="PATCH /api/admin/articles/:id" params={{ id: a.id }} body={{ status: "published" }} label={t.reinstate} />
      )}
    </>
  );
  const title = (a: Article) =>
    a.status === "published" ? (
      <Link href={href(locale, `/articles/${a.slug}`)} className="font-semibold text-ink hover:text-accent" lang={a.language}>
        {a.title}
      </Link>
    ) : (
      <span className="font-semibold text-ink" lang={a.language}>
        {a.title}
      </span>
    );
  const stateBadges = (a: Article) => (
    <div className="flex flex-wrap gap-1">
      <Badge tone={TAB_TONE[a.status]}>{t.statuses[a.status]}</Badge>
      {a.featured && <Badge tone="brand">{dict.common.featured}</Badge>}
    </div>
  );

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="font-display text-xl text-ink">{t.content}</h2>
        <ChipRow>
          {TABS.map((s) => (
            <Link key={s} href={`${href(locale, "/admin/articles")}?status=${s}`} className={`tone-${TAB_TONE[s]} chip ${status === s ? "chip-active" : ""}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status === s ? "bg-white" : "t-dot"}`} /> {t.statuses[s]}
            </Link>
          ))}
        </ChipRow>
      </div>

      {res.items.length === 0 && <p className="px-5 py-10 text-center text-muted">{dict.common.noResults}</p>}

      {/* Phones: card list */}
      <ul className="divide-y divide-line md:hidden">
        {res.items.map((a) => (
          <li key={a.id} className={`tone-${categoryTone(a.category)} relative space-y-2 p-4`}>
            <span className="absolute inset-y-3 start-0 w-1 rounded-e-full t-dot" />
            {title(a)}
            <p className="text-xs text-muted">
              {authors.get(a.authorId)?.name} · {lt(cats.get(a.category)?.name ?? { en: a.category }, locale)} · {formatDate(a.publishedAt ?? a.createdAt, locale)}
            </p>
            {stateBadges(a)}
            <div className="flex flex-wrap gap-2 pt-1">{actions(a)}</div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-bg-subtle text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-5 py-3 text-start font-semibold">{t.table.title}</th>
              <th className="px-5 py-3 text-start font-semibold">{t.table.author}</th>
              <th className="px-5 py-3 text-start font-semibold">{t.table.state}</th>
              <th className="px-5 py-3 text-start font-semibold">{t.table.date}</th>
              <th className="px-5 py-3 text-end font-semibold">{t.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {res.items.map((a) => (
              <tr key={a.id} className="align-top hover:bg-bg-subtle/60">
                <td className={`tone-${categoryTone(a.category)} max-w-sm px-5 py-4`}>
                  {title(a)}
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="font-semibold t-text">{lt(cats.get(a.category)?.name ?? { en: a.category }, locale)}</span> · {dict.articleTypes[a.type]}
                    {a.status === "published" && ` · ${formatNumber(a.stats.views, locale)} ${dict.common.views}`}
                  </p>
                </td>
                <td className="px-5 py-4 text-ink-2">{authors.get(a.authorId)?.name}</td>
                <td className="px-5 py-4">{stateBadges(a)}</td>
                <td className="px-5 py-4 text-muted">{formatDate(a.publishedAt ?? a.createdAt, locale)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap justify-end gap-2">{actions(a)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
