import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ArticleType, Locale } from "@/types/domain";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { formatNumber, getDictionary, lt } from "@/i18n";
import { getData } from "@/lib/data";
import { categoryMap, userMap } from "@/lib/data/helpers";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ChipRow, EmptyState, PageHeader } from "@/components/ui/primitives";
import { categoryTone, typeTone } from "@/lib/ui/tones";
import { FILTER_ITEM as FILTER, FILTER_LIST } from "@/components/ui/filters";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const TYPES: ArticleType[] = ["article", "essay", "opinion", "blog", "research"];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return { title: dict.explore.title, description: dict.explore.body, alternates: { canonical: `/${lang}/articles`, languages: { en: "/en/articles", ur: "/ur/articles" } } };
}

export default async function ExplorePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: SP }) {
  const { locale, dict } = await resolveLocale(params);
  const sp = await searchParams;
  const category = one(sp.category);
  const type = one(sp.type) as ArticleType | undefined;
  const language = one(sp.lang) as Locale | undefined;
  const sort = (one(sp.sort) as "latest" | "popular" | "discussed") ?? "latest";
  const q = one(sp.q);
  const page = Math.max(1, Number(one(sp.page) ?? 1));

  const data = await getData();
  const [res, cats] = await Promise.all([
    data.listArticles({ category, type: TYPES.includes(type as ArticleType) ? type : undefined, language, sort, search: q, page, pageSize: 9 }),
    categoryMap(data),
  ]);
  const authors = await userMap(data, res.items.map((a) => a.authorId));
  const pages = Math.max(1, Math.ceil(res.total / res.pageSize));

  const link = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { category, type, lang: language, sort: sort === "latest" ? undefined : sort, q, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && next.set(k, v));
    const s = next.toString();
    return `${href(locale, "/articles")}${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader eyebrow={dict.nav.articles} title={dict.explore.title} body={dict.explore.body}>
        <form role="search" action={href(locale, "/articles")} className="flex max-w-xl items-center gap-2">
          <label className="relative flex-1">
            <span className="sr-only">{dict.explore.searchLabel}</span>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input name="q" defaultValue={q} placeholder={dict.nav.searchPlaceholder} className="field h-12 ps-10" />
          </label>
          {category && <input type="hidden" name="category" value={category} />}
          <button className="btn btn-dark h-12">{dict.nav.search}</button>
        </form>
      </PageHeader>

      <div className="container-page grid grid-cols-1 gap-8 py-8 md:py-12 lg:grid-cols-12 lg:gap-12">
        <aside className="min-w-0 lg:col-span-3">
          <div className="space-y-6 lg:sticky lg:top-24 lg:space-y-8">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-faint">{dict.explore.filterCategory}</p>
              <ul className={FILTER_LIST}>
                <li>
                  <Link href={link({ category: undefined, page: undefined })} className={`${FILTER} ${!category ? "chip-active" : ""}`}>
                    <span className="h-2 w-2 rounded-full bg-brand" /> {dict.common.all}
                  </Link>
                </li>
                {[...cats.values()].map((c) => {
                  const active = category === c.slug;
                  return (
                    <li key={c.slug} className={`tone-${categoryTone(c.slug)}`}>
                      <Link href={link({ category: c.slug, page: undefined })} className={`tone-${categoryTone(c.slug)} ${FILTER} ${active ? "chip-active" : ""}`}>
                        <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : "t-dot"}`} /> {lt(c.name, locale)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-faint">{dict.explore.filterLanguage}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  [undefined, dict.explore.anyLanguage],
                  ["en", "English"],
                  ["ur", "اردو"],
                ].map(([v, l]) => (
                  <Link key={l} href={link({ lang: v, page: undefined })} className={`chip ${language === v ? "chip-active" : ""}`}>
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-9">
          <div className="mb-6 flex flex-col gap-4 border-b border-line pb-5 md:mb-8 xl:flex-row xl:items-center xl:justify-between">
            <ChipRow label={dict.explore.filterType}>
              <Link href={link({ type: undefined, page: undefined })} className={`chip ${!type ? "chip-active" : ""}`}>
                {dict.common.all}
              </Link>
              {TYPES.map((t) => (
                <Link key={t} href={link({ type: t, page: undefined })} className={`tone-${typeTone(t)} chip ${type === t ? "chip-active" : ""}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${type === t ? "bg-white" : "t-dot"}`} />
                  {dict.articleTypes[t]}
                </Link>
              ))}
            </ChipRow>
            <div className="flex items-center gap-1 overflow-x-auto text-sm scrollbar-none">
              <span className="me-1 shrink-0 text-faint">{dict.common.sortBy}</span>
              {(["latest", "popular", "discussed"] as const).map((s) => (
                <Link key={s} href={link({ sort: s === "latest" ? undefined : s, page: undefined })} className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 ${sort === s ? "bg-accent-soft font-semibold text-accent-ink" : "text-muted hover:text-ink"}`}>
                  {dict.common[s]}
                </Link>
              ))}
            </div>
          </div>

          <p className="mb-6 text-sm text-muted">
            {formatNumber(res.total, locale, false)} {dict.explore.results}
            {q && (
              <>
                {" "}· “<span className="text-ink">{q}</span>”
              </>
            )}
          </p>

          {res.items.length === 0 ? (
            <EmptyState title={dict.common.noResults} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
              {res.items.map((a) => (
                <ArticleCard key={a.id} article={a} author={authors.get(a.authorId)} category={cats.get(a.category)} locale={locale} dict={dict} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-14 flex items-center justify-between border-t border-line pt-6 text-sm" aria-label="Pagination">
              {page > 1 ? <Link className="btn btn-outline btn-sm" href={link({ page: String(page - 1) })}>{dict.common.previous}</Link> : <span />}
              <span className="text-muted">
                {dict.common.page} {formatNumber(page, locale)} {dict.common.of} {formatNumber(pages, locale)}
              </span>
              {page < pages ? <Link className="btn btn-outline btn-sm" href={link({ page: String(page + 1) })}>{dict.common.next}</Link> : <span />}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
