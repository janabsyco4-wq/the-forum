import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookMarked, CornerDownRight, Gavel, Lightbulb, PenLine, Sparkles } from "lucide-react";
import type { DebateArgument, Locale, User } from "@/types/domain";
import type { Dictionary } from "@/i18n";
import { formatDate, formatNumber, timeAgo } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { userMap } from "@/lib/data/helpers";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/primitives";
import { Countdown } from "@/components/debates/Countdown";
import { SentimentBar } from "@/components/debates/SentimentBar";
import { ArgumentForm } from "@/components/debates/ArgumentForm";
import { VoteButton } from "@/components/debates/VoteButton";
import { statusTone } from "@/components/debates/status";
import { ReportButton } from "@/components/moderation/ReportButton";
import type { Tone } from "@/lib/ui/tones";

type Params = Promise<{ lang: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  const d = await (await getData()).getDebateBySlug(slug);
  if (!d) return {};
  return { title: d.title, description: d.question, alternates: { canonical: `/${lang}/debates/${slug}`, languages: { en: `/en/debates/${slug}`, ur: `/ur/debates/${slug}` } } };
}

function Thread({ arg, all, authors, locale, dict, depth = 0 }: { arg: DebateArgument; all: DebateArgument[]; authors: Map<string, User>; locale: Locale; dict: Dictionary; depth?: number }) {
  const a = authors.get(arg.authorId);
  const children = all.filter((x) => x.parentId === arg.id);
  const kindTone: Tone =
    arg.kind === "counterargument" ? "amber" : arg.kind === "reply" ? "sky" : arg.kind === "solution" ? "emerald" : arg.side === "for" ? "teal" : "rose";
  return (
    <div className={depth > 0 ? "mt-3 border-s-2 border-line ps-3 sm:mt-4 sm:ps-5" : ""}>
      <article className={`tone-${kindTone} relative overflow-hidden rounded-2xl border bg-surface p-4 sm:p-5 ${arg.highlighted ? "t-border shadow-card" : "border-line"}`}>
        <span className="absolute inset-y-0 start-0 w-1 t-dot" />
        <div className="flex flex-wrap items-center gap-2">
          {depth > 0 && <CornerDownRight className="h-3.5 w-3.5 text-faint rtl:-scale-x-100" />}
          <Badge tone={kindTone}>{dict.debate.kinds[arg.kind]}</Badge>
          {arg.highlighted && (
            <Badge tone="brand">
              <Sparkles className="h-3 w-3" /> {dict.debate.highlighted}
            </Badge>
          )}
        </div>
        {arg.title && <h4 className="mt-3 font-display text-lg leading-snug text-ink">{arg.title}</h4>}
        <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-2">{arg.body}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
          {a && (
            <Link href={href(locale, `/u/${a.username}`)} className="flex items-center gap-2 hover:text-ink">
              <Avatar user={a} size="xs" />
              <span className="font-medium text-ink-2">{a.name}</span>
              <span>· {timeAgo(arg.createdAt, locale)}</span>
            </Link>
          )}
          <span className="flex items-center gap-3">
            <VoteButton argumentId={arg.id} votes={arg.votes} />
            <ReportButton targetType="argument" targetId={arg.id} compact />
          </span>
        </div>
      </article>
      {children.map((c) => (
        <Thread key={c.id} arg={c} all={all} authors={authors} locale={locale} dict={dict} depth={depth + 1} />
      ))}
    </div>
  );
}

export default async function DebatePage({ params }: { params: Params }) {
  const { locale, dict } = await resolveLocale(params);
  const { slug } = await params;
  const data = await getData();
  const debate = await data.getDebateBySlug(slug);
  if (!debate) notFound();
  const args = await data.listArguments(debate.id);
  const authors = await userMap(data, [...args.map((a) => a.authorId), debate.conclusion?.authorId]);
  const t = dict.debate;
  const lang = debate.language;
  const dir = lang === "ur" ? "rtl" : "ltr";
  const roots = args.filter((a) => !a.parentId && a.kind === "argument");
  const forArgs = roots.filter((a) => a.side === "for").sort((a, b) => b.votes - a.votes);
  const againstArgs = roots.filter((a) => a.side === "against").sort((a, b) => b.votes - a.votes);
  const solutions = args.filter((a) => a.kind === "solution" && !a.parentId).sort((a, b) => b.votes - a.votes);
  const open = debate.status === "open";
  const conclusionAuthor = debate.conclusion ? authors.get(debate.conclusion.authorId) : undefined;

  return (
    <>
      <header className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 mesh" />
        <div className="pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-rose/15 blur-3xl" />
        <div className="container-page relative py-10 md:py-16">
          <Link href={href(locale, "/debates")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {dict.debates.title}
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8" lang={lang} dir={dir}>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Badge tone={statusTone(debate.status)}>{dict.debates.status[debate.status]}</Badge>
                <span className="text-sm text-muted">
                  {dict.debates.week} {formatNumber(debate.weekNumber, locale)} · {formatDate(debate.opensAt, locale, { day: "numeric", month: "short" })} – {formatDate(debate.closesAt, locale, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <h1 className="font-display text-3xl leading-[1.12] text-ink md:text-5xl text-balance">{debate.title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{debate.question}</p>
            </div>
            <div className="space-y-6 lg:col-span-4">
              {open ? (
                <div>
                  <p className="mb-3 text-sm text-muted">{t.timeLeft}</p>
                  <Countdown to={debate.closesAt} />
                </div>
              ) : debate.status === "upcoming" ? (
                <p className="text-sm text-muted">
                  {t.opensOn} {formatDate(debate.opensAt, locale, { weekday: "long", day: "numeric", month: "long" })}
                </p>
              ) : (
                <p className="text-sm text-muted">{t.closed}</p>
              )}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">{t.sentiment}</p>
                <SentimentBar votesFor={debate.stats.votesFor} votesAgainst={debate.stats.votesAgainst} forLabel={debate.sides.for} againstLabel={debate.sides.against} locale={locale} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-12 py-12 lg:grid-cols-12">
        <div className="space-y-16 lg:col-span-8">
          {/* Conclusion first when it exists */}
          {debate.conclusion && (
            <section aria-labelledby="conclusion" className="relative overflow-hidden rounded-3xl bg-night p-6 text-white sm:p-8 md:p-10" lang={lang} dir={dir}>
              <div className="pointer-events-none absolute -end-16 -top-16 h-64 w-64 rounded-full bg-[#6d4fc2]/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -start-10 h-64 w-64 rounded-full bg-[#4a4fc9]/20 blur-3xl" />
              <div className="relative">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white/75">
                  <Gavel className="h-4 w-4" /> {t.conclusion}
                </p>
                {debate.conclusion.verdict && (
                  <p className="mt-4 text-sm text-white/70">
                    {t.verdict}: <span className="font-semibold text-white">{debate.conclusion.verdict === "for" ? debate.sides.for : debate.conclusion.verdict === "against" ? debate.sides.against : t.sides.neutral}</span>
                  </p>
                )}
                <h2 id="conclusion" className="mt-3 font-display text-2xl leading-snug md:text-3xl">{debate.conclusion.summary}</h2>
                <div className="prose-forum no-dropcap mt-6 text-white/80 [&_*]:text-inherit" style={{ fontSize: "1.05rem" }} dangerouslySetInnerHTML={{ __html: debate.conclusion.body }} />
                {conclusionAuthor && (
                  <p className="mt-6 flex items-center gap-2 text-sm text-white/60">
                    <Avatar user={conclusionAuthor} size="xs" /> {conclusionAuthor.name} · {formatDate(debate.conclusion.publishedAt, locale)}
                  </p>
                )}
              </div>
            </section>
          )}

          <section aria-labelledby="briefing">
            <h2 id="briefing" className="mb-5 font-display text-2xl text-ink">{t.briefing}</h2>
            <div className="prose-forum no-dropcap" lang={lang} dir={dir} style={{ fontSize: "1.1rem" }} dangerouslySetInnerHTML={{ __html: debate.context }} />
          </section>

          {/* Two-column arguments */}
          <section aria-label={dict.common.arguments}>
            <div className="grid gap-8 md:grid-cols-2">
              {([
                ["for", debate.sides.for, forArgs],
                ["against", debate.sides.against, againstArgs],
              ] as const).map(([key, label, list]) => (
                <div key={key}>
                  <div className={`tone-${key === "for" ? "teal" : "rose"} mb-5 flex items-center justify-between gap-3 rounded-2xl t-soft px-4 py-3`}>
                    <h2 className="inline-flex items-center gap-2 font-display text-xl t-text sm:text-2xl">
                      <span className="h-2.5 w-2.5 rounded-full t-dot" /> {label}
                    </h2>
                    <span className="shrink-0 text-sm font-semibold t-text">
                      {formatNumber(list.length, locale)} {dict.common.arguments}
                    </span>
                  </div>
                  <div className="space-y-6" lang={lang} dir={dir}>
                    {list.length === 0 && <p className="text-sm text-muted">{dict.common.noResults}</p>}
                    {list.map((a) => (
                      <Thread key={a.id} arg={a} all={args} authors={authors} locale={locale} dict={dict} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="solutions">
            <div className="mb-6">
              <h2 id="solutions" className="inline-flex items-center gap-2 font-display text-2xl text-ink">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald text-white">
                  <Lightbulb className="h-5 w-5" />
                </span>{" "}
                {t.solutions}
              </h2>
              <p className="mt-1 text-sm text-muted">{t.solutionsBody}</p>
            </div>
            <div className="grid gap-5" lang={lang} dir={dir}>
              {solutions.map((s) => (
                <Thread key={s.id} arg={s} all={args} authors={authors} locale={locale} dict={dict} />
              ))}
            </div>
          </section>

          {!debate.conclusion && (
            <section className="rounded-3xl border border-dashed border-line-strong p-8 text-center">
              <Gavel className="mx-auto h-6 w-6 text-faint" />
              <h2 className="mt-3 font-display text-2xl text-ink">{t.conclusion}</h2>
              <p className="mt-2 text-sm text-muted">{t.conclusionPending}</p>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div id="make-your-case" className="card scroll-mt-24 overflow-hidden p-0">
              <div className="brand-line" />
              <div className="p-5 sm:p-6">
              <h2 className="mb-5 font-display text-xl text-ink">{t.submitTitle}</h2>
              <ArgumentForm
                debateId={debate.id}
                sides={debate.sides}
                closed={!open}
                targets={args.filter((a) => a.kind !== "solution").map((a) => ({ id: a.id, label: `${a.title ?? a.body.slice(0, 60)}… — ${authors.get(a.authorId)?.name ?? ""}` }))}
              />
              </div>
            </div>
            {debate.readings.length > 0 && (
              <div className="rounded-2xl border border-line bg-bg-subtle p-6">
                <h2 className="inline-flex items-center gap-2 font-display text-lg text-ink">
                  <BookMarked className="h-4 w-4 text-violet" /> {t.readings}
                </h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {debate.readings.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} className="text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-accent hover:decoration-accent" {...(r.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        {r.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-line p-6">
              <div>
                <dt className="text-xs text-muted">{dict.common.arguments}</dt>
                <dd className="font-display text-2xl text-ink">{formatNumber(debate.stats.arguments, locale)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{dict.common.participants}</dt>
                <dd className="font-display text-2xl text-ink">{formatNumber(debate.stats.participants, locale)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
      {open && (
        <a href="#make-your-case" className="btn btn-brand fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] end-4 z-40 h-12 rounded-full px-5 shadow-float lg:hidden">
          <PenLine className="h-4 w-4" /> {t.submitTitle}
        </a>
      )}
    </>
  );
}
