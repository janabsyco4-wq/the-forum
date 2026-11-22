import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CalendarDays, Globe, GraduationCap, MapPin, Pencil } from "lucide-react";
import { formatDate, formatNumber, lt, timeAgo } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData, isPrototypeData } from "@/lib/data";
import { categoryMap } from "@/lib/data/helpers";
import { Avatar, avatarGradient } from "@/components/ui/Avatar";
import { nth, topicTone, type Tone } from "@/lib/ui/tones";
import type { UserRole } from "@/types/domain";

const ROLE_TONE: Record<UserRole, Tone> = { member: "slate", writer: "violet", ambassador: "emerald", moderator: "sky", admin: "rose" };
import { Badge, EmptyState } from "@/components/ui/primitives";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { FollowButton } from "@/components/profile/FollowButton";

type Params = Promise<{ lang: string; username: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, username } = await params;
  const u = await (await getData()).getUserByUsername(username);
  if (!u) return {};
  return { title: u.name, description: u.bio || u.headline, alternates: { canonical: `/${lang}/u/${username}` }, openGraph: { type: "profile", title: u.name } };
}

export default async function ProfilePage({ params, searchParams }: { params: Params; searchParams: Promise<{ tab?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const { username } = await params;
  const { tab = "articles" } = await searchParams;
  const data = await getData();
  const user = await data.getUserByUsername(username);
  if (!user) notFound();
  const [articles, args, discussions, cats, me, debates, iFollow] = await Promise.all([
    data.listArticles({ authorId: user.id, pageSize: 50 }),
    data.listArgumentsByAuthor(user.id),
    data.listDiscussions({ authorId: user.id }),
    categoryMap(data),
    data.getCurrentUser(),
    data.listDebates(),
    data.isFollowing(user.id),
  ]);
  const isMe = me?.id === user.id;
  const t = dict.profile;
  const n = (x: number) => formatNumber(x, locale);
  const debateById = new Map(debates.map((d) => [d.id, d]));
  const tabs = [
    ["articles", t.articles, articles.total],
    ["arguments", t.arguments, args.length],
    ["discussions", t.discussions, discussions.total],
  ] as const;

  const jsonLd = { "@context": "https://schema.org", "@type": "Person", name: user.name, description: user.bio, affiliation: user.university, address: user.city };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="relative h-36 overflow-hidden border-b border-line md:h-52" style={{ background: avatarGradient(user.id) }}>
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgb(255_255_255/0.7)_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -bottom-24 end-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
      </div>
      <div className="container-page">
        <div className="relative z-10 -mt-12 flex flex-col gap-5 md:-mt-16 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-5">
            <div className="w-fit rounded-full bg-bg p-1.5 shadow-card">
              <Avatar user={user} size="xl" />
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[1.9rem] text-ink md:text-4xl">{user.name}</h1>
                {user.role !== "member" && <Badge tone={ROLE_TONE[user.role]}>{dict.roles[user.role]}</Badge>}
                {user.status === "suspended" && <Badge tone="danger">{dict.admin.statuses.suspended}</Badge>}
              </div>
              <p className="mt-1 text-muted">{user.headline}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pb-1 sm:flex">
            {isMe || isPrototypeData ? (
              <Link href={href(locale, "/settings/profile")} className="btn btn-outline">
                <Pencil className="h-4 w-4" /> {t.editProfile}
              </Link>
            ) : null}
            {!isMe && <FollowButton userId={user.id} initialFollowing={iFollow} signedIn={!!me} />}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 md:mt-10 lg:grid-cols-12 lg:gap-12">
          <aside className="min-w-0 space-y-8 lg:col-span-4">
            {user.bio && (
              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">{t.about}</h2>
                <p className="leading-relaxed text-ink-2">{user.bio}</p>
              </div>
            )}
            <ul className="space-y-2.5 text-sm text-muted">
              {user.university && (
                <li className="flex items-center gap-2.5"><GraduationCap className="h-4 w-4 text-faint" /> {user.university}</li>
              )}
              {user.city && (
                <li className="flex items-center gap-2.5"><MapPin className="h-4 w-4 text-faint" /> {user.city}{user.country && `, ${user.country}`}</li>
              )}
              {user.website && (
                <li className="flex items-center gap-2.5"><Globe className="h-4 w-4 text-faint" /> <a href={user.website} rel="noopener noreferrer nofollow" className="hover:text-accent">{user.website.replace(/^https?:\/\//, "")}</a></li>
              )}
              <li className="flex items-center gap-2.5"><CalendarDays className="h-4 w-4 text-faint" /> {t.joined} {formatDate(user.joinedAt, locale, { month: "long", year: "numeric" })}</li>
            </ul>
            <dl className="grid grid-cols-3 gap-2 text-center sm:gap-3">
              {[
                [user.stats.followers, t.followers],
                [user.stats.following, t.following],
                [user.stats.articles, t.articles],
              ].map(([v, l], si) => (
                <div key={l as string} className={`tone-${(["indigo", "rose", "emerald"] as const)[si]} min-w-0 rounded-2xl border t-border t-softer px-2 py-3`}>
                  <dd className="font-display text-2xl t-text">{n(v as number)}</dd>
                  <dt className="truncate text-xs text-muted">{l}</dt>
                </div>
              ))}
            </dl>
            {user.badges.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">{t.badges}</h2>
                <ul className="space-y-2">
                  {user.badges.map((b, bi) => (
                    <li key={b} className={`tone-${nth(bi + 1)} flex items-center gap-3 rounded-xl t-softer px-3 py-2 text-sm font-medium text-ink-2`}>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full t-pill"><Award className="h-3.5 w-3.5" /></span>
                      {dict.badges[b]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {user.interests.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">{t.interests}</h2>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((i) => (
                    <Link key={i} href={`${href(locale, "/articles")}?category=${i}`} className="chip">{lt(cats.get(i)?.name ?? { en: i }, locale)}</Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="min-w-0 lg:col-span-8">
            <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-line px-4 scrollbar-none sm:mx-0 sm:px-0" aria-label={t.publications}>
              {tabs.map(([key, label, count]) => (
                <Link
                  key={key}
                  href={`${href(locale, `/u/${user.username}`)}?tab=${key}`}
                  aria-current={tab === key ? "page" : undefined}
                  className={`-mb-px shrink-0 whitespace-nowrap border-b-[3px] px-3 py-3 text-sm font-semibold sm:px-4 ${tab === key ? "border-accent text-accent-ink" : "border-transparent text-muted hover:text-ink"}`}
                >
                  {label} <span className="text-faint">{n(count)}</span>
                </Link>
              ))}
            </nav>

            {tab === "articles" &&
              (articles.items.length ? (
                <div className="divide-y divide-line">
                  {articles.items.map((a) => (
                    <ArticleCard key={a.id} variant="row" article={a} author={user} category={cats.get(a.category)} locale={locale} dict={dict} />
                  ))}
                </div>
              ) : (
                <EmptyState title={dict.common.noResults} />
              ))}

            {tab === "arguments" &&
              (args.length ? (
                <ul className="space-y-4">
                  {args.map((g) => {
                    const d = debateById.get(g.debateId);
                    return (
                      <li key={g.id} className={`tone-${g.kind === "solution" ? "emerald" : g.kind === "counterargument" ? "amber" : g.side === "for" ? "teal" : "rose"} card relative overflow-hidden p-4 sm:p-5`}><span className="absolute inset-y-0 start-0 w-1 t-dot" />
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                          <Badge tone={g.kind === "solution" ? "emerald" : g.kind === "counterargument" ? "amber" : g.side === "for" ? "teal" : "rose"}>{dict.debate.kinds[g.kind]}</Badge>
                          <span>{timeAgo(g.createdAt, locale)}</span>
                        </div>
                        {d && (
                          <Link href={href(locale, `/debates/${d.slug}`)} className="mt-2 block text-sm font-medium text-accent-ink hover:underline" lang={d.language}>
                            {d.title}
                          </Link>
                        )}
                        {g.title && <p className="mt-2 font-display text-lg text-ink">{g.title}</p>}
                        <p className="mt-1 text-sm leading-relaxed text-ink-2 line-clamp-3">{g.body}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState title={dict.common.noResults} />
              ))}

            {tab === "discussions" &&
              (discussions.items.length ? (
                <ul className="card divide-y divide-line">
                  {discussions.items.map((d) => (
                    <li key={d.id}>
                      <Link href={href(locale, `/discussions/${d.slug}`)} className="block p-5 hover:bg-bg-subtle" lang={d.language}>
                        <Badge tone={topicTone(d.topic)}>{dict.topics[d.topic]}</Badge>
                        <p className="mt-1 font-medium text-ink">{d.title}</p>
                        <p className="mt-1 text-xs text-muted">{n(d.stats.replies)} {dict.common.replies} · {timeAgo(d.lastActivityAt, locale)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={dict.common.noResults} />
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
