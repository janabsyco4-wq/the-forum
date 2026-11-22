import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { Debate, Locale } from "@/types/domain";
import type { Dictionary } from "@/i18n";
import { formatDate, formatNumber, getDictionary } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { Badge, PageHeader } from "@/components/ui/primitives";
import { Cover } from "@/components/ui/Cover";
import { Countdown } from "@/components/debates/Countdown";
import { SentimentBar } from "@/components/debates/SentimentBar";
import { statusTone } from "@/components/debates/status";
import { categoryTone, nth } from "@/lib/ui/tones";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const d = getDictionary(lang as Locale);
  return { title: d.debates.title, description: d.debates.body, alternates: { canonical: `/${lang}/debates`, languages: { en: "/en/debates", ur: "/ur/debates" } } };
}

function DebateRow({ d, locale, dict }: { d: Debate; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={href(locale, `/debates/${d.slug}`)} className={`tone-${categoryTone(d.category)} card card-hover group relative grid gap-4 overflow-hidden p-5 sm:gap-6 sm:p-6 md:grid-cols-12 md:items-center`}>
      <span className="absolute inset-y-0 start-0 w-1 t-dot" />
      <div className="flex items-center gap-3 md:col-span-2 md:block">
        <p className="inline-flex h-12 w-12 items-center justify-center rounded-2xl t-pill font-display text-2xl md:h-14 md:w-14 md:text-3xl">{formatNumber(d.weekNumber, locale)}</p>
        <p className="text-xs font-bold uppercase tracking-wider t-text md:mt-2">{dict.debates.week}</p>
      </div>
      <div className="md:col-span-6" lang={d.language} dir={d.language === "ur" ? "rtl" : "ltr"}>
        <Badge tone={statusTone(d.status)}>{dict.debates.status[d.status]}</Badge>
        <h3 className="mt-3 font-display text-xl leading-snug text-ink md:text-2xl">{d.title}</h3>
        {d.conclusion && <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">{d.conclusion.summary}</p>}
      </div>
      <div className="md:col-span-4">
        <SentimentBar votesFor={d.stats.votesFor} votesAgainst={d.stats.votesAgainst} forLabel={dict.debate.for} againstLabel={dict.debate.against} locale={locale} />
        <p className="mt-3 text-xs text-muted">
          {formatNumber(d.stats.arguments, locale)} {dict.common.arguments} · {formatNumber(d.stats.participants, locale)} {dict.common.participants}
        </p>
      </div>
    </Link>
  );
}

export default async function DebatesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const data = await getData();
  const all = await data.listDebates();
  const current = all.find((d) => d.status === "open");
  const upcoming = all.filter((d) => d.status === "upcoming");
  const past = all.filter((d) => d.status === "concluded" || d.status === "closed");

  return (
    <>
      <PageHeader eyebrow={dict.brand.tagline} title={dict.debates.title} body={dict.debates.body} tone="rose" />

      {current && (
        <section className="container-page py-10 md:py-14">
          <p className="eyebrow mb-5 inline-flex items-center gap-2 tone-rose md:mb-6">
            <span className="h-1.5 w-5 rounded-full t-dot" /> {dict.debates.current}
          </p>
          <div className="card overflow-hidden shadow-card lg:grid lg:grid-cols-12">
            <Cover seed={current.slug} tone="indigo" motif={1} className="h-44 sm:h-56 lg:col-span-5 lg:h-full" rounded="rounded-none" />
            <div className="p-5 sm:p-8 md:p-10 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="rose">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose" /> {dict.debates.status.open}
                </Badge>
                <span className="text-sm text-muted">
                  {dict.debates.week} {formatNumber(current.weekNumber, locale)}
                </span>
              </div>
              <h2 className="mt-4 font-display text-2xl leading-tight text-ink sm:text-3xl md:text-4xl text-balance" lang={current.language}>
                {current.title}
              </h2>
              <p className="mt-4 leading-relaxed text-muted">{current.question}</p>
              <div className="mt-8 grid gap-8 md:grid-cols-2 md:items-end">
                <div>
                  <p className="mb-3 text-sm text-muted">{dict.home.closesIn}</p>
                  <Countdown to={current.closesAt} />
                </div>
                <SentimentBar votesFor={current.stats.votesFor} votesAgainst={current.stats.votesAgainst} forLabel={current.sides.for} againstLabel={current.sides.against} locale={locale} />
              </div>
              <Link href={href(locale, `/debates/${current.slug}`)} className="btn btn-brand btn-lg mt-8 w-full sm:w-auto">
                {dict.home.enterDebate} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="container-page py-10">
        <h2 className="mb-6 font-display text-2xl text-ink md:mb-8 md:text-3xl">{dict.debates.howItWorks}</h2>
        <ol className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-5">
          {dict.debates.steps.map((s, i) => (
            <li key={s.title} className={`tone-${nth(i)} relative overflow-hidden rounded-2xl border t-border t-softer p-5`}>
              <span className="absolute inset-x-6 top-0 h-px t-dot opacity-60" />
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl t-pill font-display text-xl">{formatNumber(i + 1, locale)}</span>
              <p className="mt-3 font-semibold text-ink">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {upcoming.length > 0 && (
        <section className="container-page py-10">
          <h2 className="mb-6 font-display text-3xl text-ink">{dict.debates.upcoming}</h2>
          <div className="grid gap-4">
            {upcoming.map((d) => (
              <div key={d.id} className="tone-sky flex flex-col gap-3 rounded-2xl border-2 border-dashed t-border t-softer p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted">
                    {dict.debates.week} {formatNumber(d.weekNumber, locale)}
                  </p>
                  <p className="mt-1 font-display text-xl text-ink">{d.title}</p>
                </div>
                <p className="inline-flex items-center gap-2 text-sm text-muted">
                  <CalendarClock className="h-4 w-4" /> {dict.debate.opensOn} {formatDate(d.opensAt, locale, { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container-page py-10">
        <h2 className="mb-6 font-display text-3xl text-ink">{dict.debates.archive}</h2>
        <div className="grid gap-4">
          {past.map((d) => (
            <DebateRow key={d.id} d={d} locale={locale} dict={dict} />
          ))}
        </div>
      </section>
    </>
  );
}
