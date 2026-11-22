import Link from "next/link";
import { ArrowRight, BookOpen, Gavel, MessagesSquare, PenLine, Sparkles, TrendingUp, Users } from "lucide-react";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { formatNumber, lt, timeAgo } from "@/i18n";
import { getData } from "@/lib/data";
import { categoryMap, userMap } from "@/lib/data/helpers";
import { categoryTone, topicTone } from "@/lib/ui/tones";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Avatar } from "@/components/ui/Avatar";
import { Cover } from "@/components/ui/Cover";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import type { Paginated } from "@/types/domain";
import { Countdown } from "@/components/debates/Countdown";
import { SentimentBar } from "@/components/debates/SentimentBar";

/** Read every page of a paginated list (the data source caps page size), up to a safety limit. */
async function allPages<T>(fetchPage: (page: number) => Promise<Paginated<T>>, maxPages = 20): Promise<T[]> {
  const first = await fetchPage(1);
  const out = [...first.items];
  const pages = Math.min(maxPages, Math.ceil(first.total / Math.max(1, first.pageSize)));
  for (let p = 2; p <= pages; p++) out.push(...(await fetchPage(p)).items);
  return out;
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const data = await getData();
  const [featuredRes, latestRes, urduRes, debate, discussionsRes, writers, cats, published, members, concluded] = await Promise.all([
    data.listArticles({ featured: true, pageSize: 3 }),
    data.listArticles({ sort: "latest", pageSize: 7, language: "en" }),
    data.listArticles({ language: "ur", pageSize: 3 }),
    data.getCurrentDebate(),
    data.listDiscussions({ sort: "active", pageSize: 5 }),
    data.listFeaturedWriters(4),
    categoryMap(data),
    allPages((page) => data.listArticles({ page, pageSize: 50 })),
    allPages((page) => data.listUsers({ page, pageSize: 50 })),
    data.listDebates({ status: "concluded" }),
  ]);
  const allPublished = { items: published };
  const featured = featuredRes.items.find((a) => a.language === locale) ?? featuredRes.items[0];
  const latest = latestRes.items.filter((a) => a.id !== featured?.id).slice(0, 6);
  const authors = await userMap(data, [
    ...featuredRes.items.map((a) => a.authorId),
    ...latestRes.items.map((a) => a.authorId),
    ...urduRes.items.map((a) => a.authorId),
    ...discussionsRes.items.map((d) => d.authorId),
  ]);
  const perCategory = new Map<string, number>();
  allPublished.items.forEach((a) => perCategory.set(a.category, (perCategory.get(a.category) ?? 0) + 1));
  const t = dict.home;
  const n = (x: number) => formatNumber(x, locale);

  const pillars = [
    { key: "think", icon: BookOpen, path: "/articles", tone: "indigo", ...t.pillars.think },
    { key: "write", icon: PenLine, path: "/write", tone: "coral", ...t.pillars.write },
    { key: "debate", icon: Gavel, path: "/debates", tone: "rose", ...t.pillars.debate },
  ] as const;

  // Real counts from the database (sample data in prototype mode).
  const universities = new Set(members.map((u) => u.university?.trim().toLowerCase()).filter(Boolean)).size;
  const stats = [
    [n(members.length), t.statsMembers, "indigo"],
    [n(universities), t.statsUniversities, "emerald"],
    [n(published.length), t.statsEssays, "amber"],
    [n(concluded.length), t.statsDebates, "rose"],
  ] as const;
  const debateVotes = debate ? debate.stats.votesFor + debate.stats.votesAgainst : 0;

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 mesh" />
        <div className="pointer-events-none absolute inset-0 paper-grain opacity-50" />
        <div className="pointer-events-none absolute -top-24 end-[8%] hidden h-72 w-72 rounded-full bg-violet/10 blur-3xl animate-float md:block" />
        <div className="container-page relative grid gap-12 py-12 md:py-20 lg:grid-cols-12 lg:items-center lg:gap-14 lg:py-24">
          <div className="lg:col-span-7 animate-fade-up">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-semibold text-ink-2 shadow-soft backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-brand" />
              {t.heroEyebrow}
            </p>
            <h1 className="font-display text-[2.6rem] leading-[1.04] text-ink sm:text-6xl lg:text-[4.5rem] text-balance">
              {t.heroTitle} <span className="text-gradient">{t.heroTitleAccent}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg md:mt-6 text-pretty">{t.heroBody}</p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap md:mt-9">
              <Link href={href(locale, "/write")} className="btn btn-brand btn-lg">
                <PenLine className="h-4 w-4" /> {t.ctaPrimary}
              </Link>
              <Link href={href(locale, debate ? `/debates/${debate.slug}` : "/debates")} className="btn btn-outline btn-lg">
                {t.ctaSecondary} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </Link>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4 md:mt-12">
              {stats.map(([v, l, tone]) => (
                <div key={l} className={`tone-${tone} rounded-2xl border border-line bg-surface/70 px-4 py-3 backdrop-blur`}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-2xl text-ink sm:text-3xl">{v}</dd>
                  <dd className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full t-dot" />
                    {l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual: the week's motion with floating colour chips */}
          {debate && (
            <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
              <div className="absolute -inset-3 rotate-[-3deg] rounded-[2rem] bg-brand opacity-[0.12] blur-[2px] sm:-inset-4 rtl:rotate-[3deg]" />
              <div className="card relative overflow-hidden p-0 shadow-float animate-fade-up [animation-delay:120ms]">
                <Cover seed={debate.slug} tone="indigo" motif={1} className="h-36 w-full sm:h-44" rounded="rounded-none" />
                <div className="p-5 sm:p-7">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <Badge tone="rose">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose" /> {t.debateOfWeek}
                    </Badge>
                    <span className="text-xs text-muted">
                      {dict.debates.week} {formatNumber(debate.weekNumber, locale)}
                    </span>
                  </div>
                  <p className="font-display text-xl leading-snug text-ink sm:text-2xl" lang={debate.language}>
                    {debate.title}
                  </p>
                  <div className="mt-5 sm:mt-6">
                    <SentimentBar votesFor={debate.stats.votesFor} votesAgainst={debate.stats.votesAgainst} forLabel={dict.debate.for} againstLabel={dict.debate.against} locale={locale} />
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm sm:mt-6 sm:pt-5">
                    <span className="text-muted">
                      {n(debate.stats.arguments)} {dict.common.arguments} · {n(debate.stats.participants)} {dict.common.participants}
                    </span>
                    <Link href={href(locale, `/debates/${debate.slug}`)} className="inline-flex items-center gap-1 font-semibold text-rose hover:opacity-80">
                      {t.enterDebate} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="absolute -start-4 top-24 hidden items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-xs font-semibold shadow-card animate-float sm:flex lg:-start-10">
                <span className="tone-emerald inline-flex h-7 w-7 items-center justify-center rounded-lg t-pill"><TrendingUp className="h-4 w-4" /></span>
                <span>{n(debateVotes)} {dict.debate.votes}</span>
              </div>
              <div className="absolute -end-3 -bottom-5 hidden items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-xs font-semibold shadow-card animate-float [animation-delay:-3s] sm:flex">
                <span className="tone-amber inline-flex h-7 w-7 items-center justify-center rounded-lg t-pill"><MessagesSquare className="h-4 w-4" /></span>
                <span>{n(debate.stats.arguments)} {dict.common.arguments}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ───────── Topics ───────── */}
      <section className="container-page pt-14 md:pt-20">
        <SectionHeading eyebrow={dict.explore.filterCategory} title={t.topicsTitle} body={t.topicsBody} tone="violet" />
        <div className="scroll-row sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {[...cats.values()].map((c) => {
            const tone = categoryTone(c.slug);
            return (
              <Link
                key={c.slug}
                href={`${href(locale, "/articles")}?category=${c.slug}`}
                className={`tone-${tone} group relative w-40 overflow-hidden rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--tone-line)] hover:shadow-card sm:w-auto`}
              >
                <span className="absolute -end-8 -top-8 h-20 w-20 rounded-full t-softer transition-transform group-hover:scale-125" />
                <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl t-pill font-display text-lg">
                  {lt(c.name, locale).charAt(0)}
                </span>
                <p className="relative mt-4 font-display text-lg leading-tight text-ink">{lt(c.name, locale)}</p>
                <p className="relative mt-1 text-xs t-text">
                  {n(perCategory.get(c.slug) ?? 0)} {dict.explore.results}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────── Featured ───────── */}
      {featured && (
        <section className="container-page py-14 md:py-20">
          <p className="eyebrow mb-6 inline-flex items-center gap-2 md:mb-8">
            <span className="h-1.5 w-5 rounded-full bg-brand" /> {t.featured}
          </p>
          <ArticleCard variant="feature" article={featured} author={authors.get(featured.authorId)} category={cats.get(featured.category)} locale={locale} dict={dict} />
        </section>
      )}

      {/* ───────── Latest ───────── */}
      {latest.length > 0 && (
      <section className="container-page pb-6">
        <SectionHeading eyebrow={dict.nav.articles} title={t.latest} body={t.latestBody} tone="indigo" action={{ label: dict.common.viewAll, href: href(locale, "/articles") }} />
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {latest.map((a) => (
            <ArticleCard key={a.id} article={a} author={authors.get(a.authorId)} category={cats.get(a.category)} locale={locale} dict={dict} />
          ))}
        </div>
      </section>
      )}

      {/* ───────── Debate band ───────── */}
      {debate && (
        <section className="container-page py-14 md:py-20">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-night px-5 py-10 text-white sm:px-8 md:rounded-[2rem] md:px-14 md:py-16">
            <div className="pointer-events-none absolute -end-24 -top-24 h-96 w-96 rounded-full bg-[#6d4fc2]/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 start-1/4 h-80 w-80 rounded-full bg-[#4a4fc9]/20 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
              <div className="lg:col-span-7">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white/75">
                  <Gavel className="h-3.5 w-3.5" /> {t.debateOfWeek} · {dict.debates.week} {formatNumber(debate.weekNumber, locale)}
                </p>
                <h2 className="font-display text-[1.9rem] leading-[1.15] md:text-5xl text-balance" lang={debate.language}>
                  {debate.title}
                </h2>
                <p className="mt-4 max-w-xl leading-relaxed text-white/70 md:mt-5" lang={debate.language}>
                  {debate.question}
                </p>
                <div className="mt-7 max-w-md md:mt-8">
                  <SentimentBar tone="dark" votesFor={debate.stats.votesFor} votesAgainst={debate.stats.votesAgainst} forLabel={debate.sides.for} againstLabel={debate.sides.against} locale={locale} />
                </div>
              </div>
              <div className="lg:col-span-5 lg:justify-self-end">
                <p className="mb-3 text-sm text-white/60">{t.closesIn}</p>
                <Countdown to={debate.closesAt} tone="dark" />
                <Link href={href(locale, `/debates/${debate.slug}`)} className="btn btn-brand btn-lg mt-7 w-full sm:w-auto md:mt-8">
                  {t.enterDebate} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───────── Pillars ───────── */}
      <section className="container-page py-6 md:py-10">
        <SectionHeading eyebrow={dict.brand.tagline} title={t.pillarsTitle} tone="coral" />
        <div className="grid gap-4 sm:grid-cols-3">
          {pillars.map((p, i) => (
            <Link key={p.key} href={href(locale, p.path)} className={`tone-${p.tone} card card-hover group relative overflow-hidden p-6 md:p-7`}>
              <span className="absolute inset-x-6 top-0 h-px t-dot opacity-60" />
              <span className="pointer-events-none absolute -end-10 -bottom-10 h-32 w-32 rounded-full t-softer transition-transform duration-500 group-hover:scale-150" />
              <div className="relative flex items-center justify-between">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl t-pill">
                  <p.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-sm t-text">0{i + 1}</span>
              </div>
              <h3 className="relative mt-6 font-display text-3xl text-ink md:mt-8">{p.title}</h3>
              <p className="relative mt-2.5 text-[0.95rem] leading-relaxed text-muted">{p.body}</p>
              <ArrowRight className="relative mt-5 h-4 w-4 t-text transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      {/* ───────── Discussions + Writers ───────── */}
      {(discussionsRes.items.length > 0 || writers.length > 0) && (
      <section className="container-page grid gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-14">
        {discussionsRes.items.length > 0 && (
        <div className="min-w-0 lg:col-span-7">
          <SectionHeading title={t.discussionsTitle} body={t.discussionsBody} tone="amber" action={{ label: dict.common.viewAll, href: href(locale, "/discussions") }} />
          <ul className="card divide-y divide-line overflow-hidden">
            {discussionsRes.items.map((d) => {
              const a = authors.get(d.authorId);
              const tone = topicTone(d.topic);
              return (
                <li key={d.id} className={`tone-${tone}`}>
                  <Link href={href(locale, `/discussions/${d.slug}`)} className="relative flex items-start gap-3 p-4 transition-colors hover-tone sm:gap-4 sm:p-5">
                    <span className="absolute inset-y-3 start-0 w-1 rounded-e-full t-dot" />
                    {a && <Avatar user={a} size="sm" />}
                    <div className="min-w-0 flex-1" lang={d.language}>
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Badge tone={tone}>{dict.topics[d.topic]}</Badge>
                        {d.pinned && <Badge>{dict.common.pinned}</Badge>}
                        <span>{timeAgo(d.lastActivityAt, locale)}</span>
                      </div>
                      <p className="font-semibold leading-snug text-ink">{d.title}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold t-pill">
                      <MessagesSquare className="h-3.5 w-3.5" /> {n(d.stats.replies)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        )}
        {writers.length > 0 && (
        <div className="min-w-0 lg:col-span-5">
          <SectionHeading title={t.writersTitle} body={t.writersBody} tone="violet" action={{ label: dict.common.viewAll, href: href(locale, "/articles") }} />
          <div className="grid gap-3 sm:gap-4">
            {writers.map((w) => (
              <Link key={w.id} href={href(locale, `/u/${w.username}`)} className="card card-hover flex min-w-0 items-center gap-4 p-4 sm:p-5">
                <Avatar user={w} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg text-ink">{w.name}</p>
                  <p className="truncate text-sm text-muted">{w.headline}</p>
                </div>
                <div className="shrink-0 text-end text-xs text-muted">
                  <p className="font-display text-lg text-gradient">{n(w.stats.followers)}</p>
                  {dict.profile.followers}
                </div>
              </Link>
            ))}
          </div>
        </div>
        )}
      </section>
      )}

      {/* ───────── Urdu shelf ───────── */}
      {urduRes.items.length > 0 && (
        <section className="relative overflow-hidden border-y border-line py-14 md:py-20">
          <div className="pointer-events-none absolute inset-0 mesh opacity-70" />
          <div className="container-page relative">
            <div className="mb-8 flex flex-col gap-2 md:mb-10 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-nastaliq)] text-3xl leading-[2] text-gradient md:text-4xl" lang="ur" dir="rtl">
                  {t.urduTitle}
                </h2>
                <p className="text-muted">{t.urduBody}</p>
              </div>
              <Link href={`${href(locale, "/articles")}?lang=ur`} className="text-sm font-semibold text-accent-ink hover:opacity-80">
                {dict.common.viewAll}
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3 md:gap-6" dir="rtl" lang="ur">
              {urduRes.items.map((a) => {
                const tone = categoryTone(a.category);
                return (
                  <Link key={a.id} href={href(locale, `/articles/${a.slug}`)} className={`tone-${tone} card card-hover relative flex flex-col overflow-hidden p-6 md:p-7`}>
                    <span className="absolute inset-x-6 top-0 h-px t-dot opacity-60" />
                    <Badge tone={tone} className="w-fit">{lt(cats.get(a.category)?.name ?? { en: a.category }, "ur")}</Badge>
                    <h3 className="mt-3 font-[family-name:var(--font-nastaliq)] text-xl leading-[2.1] text-ink md:text-2xl">{a.title}</h3>
                    <p className="mt-2 font-[family-name:var(--font-naskh)] leading-[2] text-muted line-clamp-3">{a.excerpt}</p>
                    <p className="mt-auto pt-5 font-[family-name:var(--font-naskh)] text-sm font-semibold t-text">{authors.get(a.authorId)?.name}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ───────── Join ───────── */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-night px-5 py-14 text-center text-white sm:px-8 md:rounded-[2rem] md:px-16 md:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgb(255_255_255/0.8)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="pointer-events-none absolute -start-24 -top-24 h-80 w-80 rounded-full bg-[#6d4fc2]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -end-24 h-80 w-80 rounded-full bg-[#9c4790]/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-[2rem] leading-tight md:text-5xl text-balance">{t.joinTitle}</h2>
            <p className="mt-4 text-base text-white/70 md:text-lg">{t.joinBody}</p>
            <div className="mt-8 grid gap-3 sm:flex sm:justify-center">
              <Link href={href(locale, "/register")} className="btn btn-lg bg-white text-[#1c1b45] hover:bg-white/90">
                {dict.nav.join}
              </Link>
              <Link href={href(locale, "/articles")} className="btn btn-lg border border-white/20 text-white hover:bg-white/10">
                {dict.nav.articles}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
