import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText, Gavel, MessagesSquare, Pencil, PenLine, ShieldCheck, UserRound } from "lucide-react";
import type { ArticleStatus } from "@/types/domain";
import { formatNumber, timeAgo } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { categoryMap } from "@/lib/data/helpers";
import { requireUser } from "@/lib/guard";
import { lt } from "@/i18n";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Cover } from "@/components/ui/Cover";
import { categoryTone, topicTone, type Tone } from "@/lib/ui/tones";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const TABS = ["draft", "pending", "published", "rejected"] as const;
type Tab = (typeof TABS)[number];
const TAB_TONE: Record<Tab, Tone> = { draft: "slate", pending: "amber", published: "emerald", rejected: "rose" };

export default async function DashboardPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const me = await requireUser(locale, "/dashboard");
  // Prototype mode has no accounts: there is nothing personal to show.
  if (!me) redirect(href(locale, "/login"));
  const t = dict.dashboard;
  const raw = (await searchParams).tab;
  const tab: Tab = (TABS as readonly string[]).includes(raw ?? "") ? (raw as Tab) : "draft";

  const data = await getData();
  const byStatus = (status: ArticleStatus) => data.listArticles({ authorId: me.id, status, pageSize: 50 });
  const [drafts, pending, published, rejected, args, discussions, debate, debates, cats] = await Promise.all([
    byStatus("draft"),
    byStatus("pending"),
    byStatus("published"),
    byStatus("rejected"),
    data.listArgumentsByAuthor(me.id),
    data.listDiscussions({ authorId: me.id, pageSize: 10 }),
    data.getCurrentDebate(),
    data.listDebates(),
    categoryMap(data),
  ]);
  const lists = { draft: drafts, pending, published, rejected };
  const current = lists[tab];
  const n = (x: number) => formatNumber(x, locale);
  const debateById = new Map(debates.map((d) => [d.id, d]));
  const staff = me.role === "admin" || me.role === "moderator";

  const stats = [
    [published.total, t.stats.articles, "emerald"],
    [drafts.total, t.stats.drafts, "slate"],
    [pending.total, t.stats.inReview, "amber"],
    [args.length, t.stats.arguments, "rose"],
  ] as const;

  return (
    <div className="container-page py-8 md:py-12">
      {/* Greeting */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar user={me} size="lg" />
          <div className="min-w-0">
            <p className="text-sm text-muted">{t.greeting}</p>
            <h1 className="truncate font-display text-3xl text-ink md:text-4xl">{me.name}</h1>
            <p className="mt-0.5 text-sm text-muted">{t.body}</p>
          </div>
        </div>
        <Link href={href(locale, "/write")} className="btn btn-brand btn-lg w-full md:w-auto">
          <PenLine className="h-4 w-4" /> {dict.nav.write}
        </Link>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([v, l, tone]) => (
          <div key={l} className={`tone-${tone} rounded-2xl border border-line bg-surface px-4 py-4`}>
            <dd className="font-display text-3xl text-ink">{n(v)}</dd>
            <dt className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full t-dot" /> {l}
            </dt>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* My writing */}
        <section className="min-w-0 lg:col-span-8">
          <h2 className="mb-4 font-display text-2xl text-ink">{t.myWriting}</h2>
          <nav className="scroll-row mb-5 sm:mx-0 sm:px-0" aria-label={t.myWriting}>
            {TABS.map((k) => (
              <Link
                key={k}
                href={`${href(locale, "/dashboard")}?tab=${k}`}
                aria-current={tab === k ? "page" : undefined}
                className={`tone-${TAB_TONE[k]} chip ${tab === k ? "chip-active" : ""}`}
              >
                {t.tabs[k]} <span className="opacity-70">{n(lists[k].total)}</span>
              </Link>
            ))}
          </nav>

          {current.items.length ? (
            <ul className="card divide-y divide-line overflow-hidden">
              {current.items.map((a) => {
                const editable = a.status === "draft" || a.status === "rejected";
                const cat = cats.get(a.category);
                return (
                  <li key={a.id} className="flex gap-4 p-4 sm:p-5">
                    <Cover seed={a.slug} tone={categoryTone(a.category)} className="hidden h-20 w-28 shrink-0 sm:block" rounded="rounded-xl" />
                    <div className="min-w-0 flex-1" lang={a.language}>
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Badge tone={TAB_TONE[tab]}>{dict.admin.statuses[a.status]}</Badge>
                        {cat && <span>{lt(cat.name, locale)}</span>}
                        <span>· {t.updated} {timeAgo(a.updatedAt, locale)}</span>
                      </div>
                      <p className="font-display text-lg leading-snug text-ink">{a.title || "—"}</p>
                      {a.moderationNote && (
                        <p className="mt-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
                          <span className="font-semibold">{t.note}:</span> {a.moderationNote}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {editable && (
                          <Link href={`${href(locale, "/write")}?slug=${encodeURIComponent(a.slug)}`} className="btn btn-sm btn-outline">
                            <Pencil className="h-3.5 w-3.5" /> {t.edit}
                          </Link>
                        )}
                        <Link href={href(locale, `/articles/${a.slug}`)} className="btn btn-sm btn-ghost">
                          {t.view} <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title={t.empty}
              action={
                <Link href={href(locale, "/write")} className="btn btn-primary">
                  <PenLine className="h-4 w-4" /> {t.startWriting}
                </Link>
              }
            />
          )}

          {/* Debate contributions */}
          <h2 className="mb-4 mt-12 font-display text-2xl text-ink">{t.myArguments}</h2>
          {args.length ? (
            <ul className="space-y-3">
              {args.slice(0, 6).map((g) => {
                const d = debateById.get(g.debateId);
                return (
                  <li key={g.id} className="card p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <Badge tone={g.side === "for" ? "teal" : g.side === "against" ? "rose" : "emerald"}>{dict.debate.kinds[g.kind]}</Badge>
                      <span>{timeAgo(g.createdAt, locale)}</span>
                    </div>
                    {d && (
                      <Link href={href(locale, `/debates/${d.slug}`)} className="mt-1.5 block text-sm font-medium text-accent-ink hover:underline" lang={d.language}>
                        {d.title}
                      </Link>
                    )}
                    <p className="mt-1 text-sm text-ink-2 line-clamp-2">{g.body}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title={t.empty} />
          )}
        </section>

        {/* Sidebar */}
        <aside className="min-w-0 space-y-6 lg:col-span-4">
          {staff && (
            <div className="relative overflow-hidden rounded-2xl bg-night p-6 text-white">
              <div className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-[#6d4fc2]/40 blur-3xl" />
              <ShieldCheck className="relative h-6 w-6 text-white/80" />
              <p className="relative mt-3 font-display text-xl">{t.adminTitle}</p>
              <p className="relative mt-1 text-sm text-white/70">{t.adminBody}</p>
              <Link href={href(locale, "/admin")} className="btn relative mt-4 bg-white text-[#1c1b45] hover:bg-white/90">
                {t.openAdmin} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </Link>
            </div>
          )}

          <div className="card p-5">
            <p className="mb-3 font-display text-lg text-ink">{t.quick}</p>
            <ul className="space-y-1">
              {[
                debate && { icon: Gavel, label: t.joinDebate, path: `/debates/${debate.slug}`, tone: "rose" as Tone },
                { icon: MessagesSquare, label: t.startDiscussion, path: "/discussions", tone: "amber" as Tone },
                { icon: FileText, label: dict.nav.write, path: "/write", tone: "indigo" as Tone },
                { icon: UserRound, label: t.viewProfile, path: `/u/${me.username}`, tone: "violet" as Tone },
                { icon: Pencil, label: dict.nav.settings, path: "/settings/profile", tone: "slate" as Tone },
              ]
                .filter((x): x is NonNullable<typeof x> => !!x)
                .map((x) => (
                  <li key={x.path}>
                    <Link href={href(locale, x.path)} className={`tone-${x.tone} flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-ink-2 hover-tone hover:text-ink`}>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg t-pill"><x.icon className="h-4 w-4" /></span>
                      <span className="flex-1">{x.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-faint rtl:-scale-x-100" />
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className="card p-5">
            <p className="mb-3 font-display text-lg text-ink">{t.myDiscussions}</p>
            {discussions.items.length ? (
              <ul className="space-y-3">
                {discussions.items.map((d) => (
                  <li key={d.id}>
                    <Link href={href(locale, `/discussions/${d.slug}`)} className="block" lang={d.language}>
                      <Badge tone={topicTone(d.topic)}>{dict.topics[d.topic]}</Badge>
                      <p className="mt-1 text-sm font-medium text-ink hover:underline">{d.title}</p>
                      <p className="text-xs text-muted">{n(d.stats.replies)} {dict.common.replies} · {timeAgo(d.lastActivityAt, locale)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t.empty}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
