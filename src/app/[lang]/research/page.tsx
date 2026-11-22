import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, BookOpen, Download, FileText, Quote, Search } from "lucide-react";
import type { Locale, ResearchType } from "@/types/domain";
import { formatDate, formatNumber, getDictionary, lt } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { categoryMap, userMap } from "@/lib/data/helpers";
import { Badge, ChipRow, EmptyState, PageHeader } from "@/components/ui/primitives";
import { categoryTone, researchTone } from "@/lib/ui/tones";

const TYPES: ResearchType[] = ["paper", "policy-brief", "dataset", "review", "challenge-entry"];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const d = getDictionary(lang as Locale);
  return { title: d.research.title, description: d.research.body, alternates: { canonical: `/${lang}/research`, languages: { en: "/en/research", ur: "/ur/research" } } };
}

export default async function ResearchPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ field?: string; type?: string; q?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const t = dict.research;
  const sp = await searchParams;
  const type = TYPES.includes(sp.type as ResearchType) ? (sp.type as ResearchType) : undefined;
  const data = await getData();
  const [items, cats] = await Promise.all([data.listResearch({ field: sp.field, type, search: sp.q }), categoryMap(data)]);
  const authors = await userMap(data, items.flatMap((r) => r.authorIds));
  const fields = [...new Set((await data.listResearch()).map((r) => r.field))];
  const qs = (p: Record<string, string | undefined>) => {
    const s = new URLSearchParams(Object.entries({ field: sp.field, type, q: sp.q, ...p }).filter(([, v]) => v) as [string, string][]).toString();
    return `${href(locale, "/research")}${s ? `?${s}` : ""}`;
  };
  const n = (x: number) => formatNumber(x, locale);

  return (
    <>
      <PageHeader eyebrow={dict.nav.research} title={t.title} body={t.body} tone="cyan">
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <form role="search" action={href(locale, "/research")} className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <label className="sr-only" htmlFor="rq">{dict.nav.search}</label>
            <input id="rq" name="q" defaultValue={sp.q} placeholder={dict.nav.searchPlaceholder} className="field h-12 ps-10" />
          </form>
          <Link href={href(locale, "/write")} className="btn btn-brand btn-lg">
            {t.submit}
          </Link>
        </div>
      </PageHeader>

      <div className="container-page grid grid-cols-1 gap-10 py-8 md:py-12 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-8">
          <ChipRow label={t.types.paper} className="mb-3 sm:mb-4">
            <Link href={qs({ type: undefined })} className={`chip ${!type ? "chip-active" : ""}`}>{dict.common.all}</Link>
            {TYPES.map((x) => (
              <Link key={x} href={qs({ type: x })} className={`tone-${researchTone(x)} chip ${type === x ? "chip-active" : ""}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${type === x ? "bg-white" : "t-dot"}`} /> {t.types[x]}
              </Link>
            ))}
          </ChipRow>
          <ChipRow label={t.field} className="mb-6 md:mb-8">
            <Link href={qs({ field: undefined })} className={`chip ${!sp.field ? "chip-active" : ""}`}>{t.allFields}</Link>
            {fields.map((f) => (
              <Link key={f} href={qs({ field: f })} className={`tone-${categoryTone(f)} chip ${sp.field === f ? "chip-active" : ""}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sp.field === f ? "bg-white" : "t-dot"}`} /> {lt(cats.get(f)?.name ?? { en: f }, locale)}
              </Link>
            ))}
          </ChipRow>

          {items.length === 0 ? (
            <EmptyState title={dict.common.noResults} />
          ) : (
            <ul className="space-y-4 md:space-y-5">
              {items.map((r) => {
                const isUr = /[؀-ۿ]/.test(r.title);
                const tone = researchTone(r.type);
                return (
                  <li key={r.id} className={`tone-${tone} card relative overflow-hidden p-5 sm:p-6 md:p-7`}>
                    <span className="absolute inset-y-0 start-0 w-1 t-dot" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={tone}>
                        <FileText className="h-3 w-3" /> {t.types[r.type]}
                      </Badge>
                      <Badge tone={categoryTone(r.field)}>{lt(cats.get(r.field)?.name ?? { en: r.field }, locale)}</Badge>
                      {r.peerReviewed && (
                        <Badge tone="success">
                          <BadgeCheck className="h-3 w-3" /> {t.peerReviewed}
                        </Badge>
                      )}
                    </div>
                    <div lang={isUr ? "ur" : "en"} dir={isUr ? "rtl" : "ltr"}>
                      <h2 className="mt-4 font-display text-2xl leading-snug text-ink">{r.title}</h2>
                      <p className="mt-2 text-sm text-ink-2">
                        {r.authorIds.map((id, i) => {
                          const u = authors.get(id);
                          return u ? (
                            <span key={id}>
                              {i > 0 && ", "}
                              <Link href={href(locale, `/u/${u.username}`)} className="font-medium hover:text-accent">{u.name}</Link>
                            </span>
                          ) : null;
                        })}
                        {r.institution && <span className="text-muted"> · {r.institution}</span>}
                        {r.supervisor && <span className="text-muted"> · {t.supervisor}: {r.supervisor}</span>}
                      </p>
                      <p className="mt-4 leading-relaxed text-muted">{r.abstract}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {r.keywords.map((k) => (
                        <span key={k} className="rounded-md px-2 py-0.5 text-xs t-pill">#{k}</span>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted">
                        {formatDate(r.publishedAt, locale)} · {n(r.stats.reads)} {t.reads} · {n(r.stats.citations)} {t.citations} · {n(r.stats.downloads)} {t.downloads}
                      </p>
                      <div className="flex gap-2">
                        <span className="btn btn-outline btn-sm cursor-not-allowed opacity-60" title={dict.prototype.notSaved} aria-disabled="true">
                          <Download className="h-3.5 w-3.5" /> PDF
                        </span>
                        <span className="btn btn-ghost btn-sm" title={`${r.authorIds.map((id) => authors.get(id)?.name).join(", ")} (${new Date(r.publishedAt).getFullYear()}). ${r.title}. THE FORUM Research Hub.`}>
                          <Quote className="h-3.5 w-3.5" /> {t.cite}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="card overflow-hidden p-0"><div className="mx-6 h-px bg-brand opacity-60" /><div className="p-5 sm:p-6">
              <h2 className="inline-flex items-center gap-2 font-display text-xl text-ink">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan text-white"><BookOpen className="h-5 w-5" /></span> {t.submitTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t.submitBody}</p>
              <Link href={href(locale, "/write")} className="btn btn-primary mt-5 w-full">
                {t.submitCta}
              </Link>
            </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
