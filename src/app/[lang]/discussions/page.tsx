import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Lock, MessagesSquare, Pin, Users } from "lucide-react";
import type { DiscussionTopic, Locale } from "@/types/domain";
import { formatNumber, getDictionary, timeAgo } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { userMap } from "@/lib/data/helpers";
import { topicTone } from "@/lib/ui/tones";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, EmptyState, PageHeader } from "@/components/ui/primitives";
import { FILTER_ITEM, FILTER_LIST } from "@/components/ui/filters";
import { NewDiscussion } from "@/components/discussions/NewDiscussion";

const TOPICS: DiscussionTopic[] = ["current-affairs", "society", "politics", "education", "history", "economy", "science", "culture", "philosophy", "other"];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const d = getDictionary(lang as Locale);
  return { title: d.discussions.title, description: d.discussions.body, alternates: { canonical: `/${lang}/discussions`, languages: { en: "/en/discussions", ur: "/ur/discussions" } } };
}

export default async function DiscussionsPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ topic?: string; sort?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const sp = await searchParams;
  const topic = TOPICS.includes(sp.topic as DiscussionTopic) ? (sp.topic as DiscussionTopic) : undefined;
  const sort = (["active", "latest", "popular"].includes(sp.sort ?? "") ? sp.sort : "active") as "active" | "latest" | "popular";
  const data = await getData();
  const res = await data.listDiscussions({ topic, sort });
  const authors = await userMap(data, res.items.map((d) => d.authorId));
  const qs = (p: Record<string, string | undefined>) => {
    const s = new URLSearchParams(Object.entries({ topic, sort: sort === "active" ? undefined : sort, ...p }).filter(([, v]) => v) as [string, string][]).toString();
    return `${href(locale, "/discussions")}${s ? `?${s}` : ""}`;
  };
  const n = (x: number) => formatNumber(x, locale);

  return (
    <>
      <PageHeader eyebrow={dict.nav.discussions} title={dict.discussions.title} body={dict.discussions.body} tone="amber">
        <NewDiscussion topics={TOPICS} />
      </PageHeader>
      <div className="container-page grid grid-cols-1 gap-6 py-8 md:py-12 lg:grid-cols-12 lg:gap-10">
        <aside className="min-w-0 lg:col-span-3">
          <nav aria-label={dict.discussions.topic} className="lg:sticky lg:top-24">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-faint">{dict.discussions.topic}</p>
            <ul className={FILTER_LIST}>
              <li>
                <Link href={qs({ topic: undefined })} className={`${FILTER_ITEM} ${!topic ? "chip-active" : ""}`}>
                  <span className="h-2 w-2 rounded-full bg-brand" /> {dict.common.all}
                </Link>
              </li>
              {TOPICS.map((t) => (
                <li key={t}>
                  <Link href={qs({ topic: t })} className={`tone-${topicTone(t)} ${FILTER_ITEM} ${topic === t ? "chip-active" : ""}`}>
                    <span className={`h-2 w-2 rounded-full ${topic === t ? "bg-white" : "t-dot"}`} /> {dict.topics[t]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="min-w-0 lg:col-span-9">
          <div className="mb-5 flex items-center gap-1 overflow-x-auto text-sm scrollbar-none">
            <span className="me-1 shrink-0 text-faint">{dict.common.sortBy}</span>
            {(["active", "latest", "popular"] as const).map((s) => (
              <Link
                key={s}
                href={qs({ sort: s === "active" ? undefined : s })}
                className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 ${sort === s ? "bg-accent-soft font-semibold text-accent-ink" : "text-muted hover:text-ink"}`}
              >
                {s === "popular" ? dict.common.discussed : dict.common[s]}
              </Link>
            ))}
          </div>
          {res.items.length === 0 ? (
            <EmptyState title={dict.common.noResults} />
          ) : (
            <ul className="space-y-3">
              {res.items.map((d) => {
                const a = authors.get(d.authorId);
                const tone = topicTone(d.topic);
                return (
                  <li key={d.id} className={`tone-${tone}`}>
                    <Link
                      href={href(locale, `/discussions/${d.slug}`)}
                      className={`card card-hover relative flex gap-3 overflow-hidden p-4 sm:gap-4 sm:p-5 md:p-6 ${d.pinned ? "t-softer t-border" : ""}`}
                    >
                      <span className="absolute inset-y-0 start-0 w-1 t-dot" />
                      {a && <Avatar user={a} size="md" />}
                      <div className="min-w-0 flex-1" lang={d.language} dir={d.language === "ur" ? "rtl" : "ltr"}>
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                          <Badge tone={tone}>{dict.topics[d.topic]}</Badge>
                          {d.pinned && (
                            <Badge tone="dark">
                              <Pin className="h-3 w-3" /> {dict.common.pinned}
                            </Badge>
                          )}
                          {d.locked && (
                            <Badge tone="warning">
                              <Lock className="h-3 w-3" /> {dict.common.locked}
                            </Badge>
                          )}
                        </div>
                        <h2 className="font-display text-lg leading-snug text-ink sm:text-xl">{d.title}</h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">{d.body}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                          <span>
                            {dict.discussions.startedBy} <span className="font-semibold text-ink-2">{a?.name}</span>
                          </span>
                          <span>
                            {dict.discussions.lastActive} {timeAgo(d.lastActivityAt, locale)}
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold t-text sm:hidden">
                            <MessagesSquare className="h-3.5 w-3.5" /> {n(d.stats.replies)}
                          </span>
                        </div>
                      </div>
                      <div className="hidden shrink-0 flex-col items-end gap-2 text-xs sm:flex">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold t-pill">
                          <MessagesSquare className="h-3.5 w-3.5" /> {n(d.stats.replies)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted">
                          <Users className="h-3.5 w-3.5" /> {n(d.stats.participants)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted">
                          <Eye className="h-3.5 w-3.5" /> {n(d.stats.views)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
