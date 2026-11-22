import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Lock, MessagesSquare, Users } from "lucide-react";
import { formatDate, formatNumber } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { userMap } from "@/lib/data/helpers";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/primitives";
import { CommentSection } from "@/components/comments/CommentSection";
import { ReportButton } from "@/components/moderation/ReportButton";
import { topicTone } from "@/lib/ui/tones";

type Params = Promise<{ lang: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  const d = await (await getData()).getDiscussionBySlug(slug);
  if (!d) return {};
  return { title: d.title, description: d.body.slice(0, 160), alternates: { canonical: `/${lang}/discussions/${slug}` } };
}

export default async function DiscussionPage({ params }: { params: Params }) {
  const { locale, dict } = await resolveLocale(params);
  const { slug } = await params;
  const data = await getData();
  const d = await data.getDiscussionBySlug(slug);
  if (!d || d.status !== "visible") notFound();
  const replies = await data.listComments("discussion", d.id);
  const authors = await userMap(data, [d.authorId, ...replies.map((r) => r.authorId)]);
  const author = authors.get(d.authorId);
  const dir = d.language === "ur" ? "rtl" : "ltr";

  return (
    <div className="container-page py-10 md:py-14">
      <Link href={href(locale, "/discussions")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {dict.discussions.title}
      </Link>
      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <article className={`tone-${topicTone(d.topic)} card relative overflow-hidden p-5 sm:p-7 md:p-10`} lang={d.language} dir={dir}><span className="absolute inset-x-0 top-0 h-1.5 t-dot" />
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone={topicTone(d.topic)}>{dict.topics[d.topic]}</Badge>
              {d.locked && (
                <Badge tone="warning">
                  <Lock className="h-3 w-3" /> {dict.common.locked}
                </Badge>
              )}
            </div>
            <h1 className="font-display text-3xl leading-tight text-ink md:text-4xl text-balance">{d.title}</h1>
            {author && (
              <div className="mt-5 flex items-center gap-3 text-sm text-muted">
                <Avatar user={author} size="sm" />
                <Link href={href(locale, `/u/${author.username}`)} className="font-medium text-ink-2 hover:text-accent">
                  {author.name}
                </Link>
                <span>· {formatDate(d.createdAt, locale)}</span>
              </div>
            )}
            <p className="mt-6 whitespace-pre-line font-serif text-lg leading-relaxed text-ink-2">{d.body}</p>
            <div className="mt-6 flex justify-end border-t border-line pt-4">
              <ReportButton targetType="discussion" targetId={d.id} />
            </div>
          </article>
          <div className="mt-12">
            {d.locked ? (
              <p className="rounded-xl border border-line bg-bg-subtle p-4 text-sm text-muted">{dict.common.locked}</p>
            ) : (
              <CommentSection
                comments={replies}
                authors={authors}
                locale={locale}
                dict={dict}
                targetType="discussion"
                targetId={d.id}
                title={dict.discussions.joinThread}
                placeholder={dict.discussions.replyPlaceholder}
              />
            )}
          </div>
        </div>
        <aside className="lg:col-span-4">
          <div className="space-y-6 lg:sticky lg:top-24">
            <dl className="card grid grid-cols-3 gap-4 p-6 text-center">
              {[
                [MessagesSquare, d.stats.replies, dict.common.replies],
                [Users, d.stats.participants, dict.common.participants],
                [Eye, d.stats.views, dict.common.views],
              ].map(([Icon, v, l]) => {
                const I = Icon as typeof Eye;
                return (
                  <div key={l as string}>
                    <I className="mx-auto h-4 w-4 text-faint" />
                    <dd className="mt-2 font-display text-2xl text-ink">{formatNumber(v as number, locale)}</dd>
                    <dt className="text-xs text-muted">{l as string}</dt>
                  </div>
                );
              })}
            </dl>
            <p className="rounded-2xl border border-line bg-bg-subtle p-5 text-sm leading-relaxed text-muted">{dict.discussions.rules}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
