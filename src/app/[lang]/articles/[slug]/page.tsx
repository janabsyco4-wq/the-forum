import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Locale } from "@/types/domain";
import { resolveLocale } from "@/i18n/server";
import { SITE_URL, href } from "@/i18n/config";
import { formatDate, formatNumber, lt } from "@/i18n";
import { getData } from "@/lib/data";
import { categoryMap, userMap } from "@/lib/data/helpers";
import { Cover } from "@/components/ui/Cover";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/primitives";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticleActions } from "@/components/articles/ArticleActions";
import { CommentSection } from "@/components/comments/CommentSection";
import { categoryTone, typeTone } from "@/lib/ui/tones";

type Params = Promise<{ lang: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  const data = await getData();
  const a = await data.getArticleBySlug(slug);
  if (!a) return {};
  const author = await data.getUserById(a.authorId);
  return {
    title: a.title,
    description: a.excerpt,
    authors: author ? [{ name: author.name }] : undefined,
    alternates: { canonical: `/${lang}/articles/${slug}`, languages: { en: `/en/articles/${slug}`, ur: `/ur/articles/${slug}` } },
    openGraph: { type: "article", title: a.title, description: a.excerpt, publishedTime: a.publishedAt, authors: author ? [author.name] : undefined, tags: a.tags },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { locale, dict } = await resolveLocale(params);
  const { slug } = await params;
  const data = await getData();
  const article = await data.getArticleBySlug(slug);
  if (!article || article.status !== "published") notFound();

  const [author, cats, comments, moreRes, relatedRes] = await Promise.all([
    data.getUserById(article.authorId),
    categoryMap(data),
    data.listComments("article", article.id),
    data.listArticles({ authorId: article.authorId, pageSize: 4 }),
    data.listArticles({ category: article.category, pageSize: 4 }),
  ]);
  const commenters = await userMap(data, [...comments.map((c) => c.authorId), ...relatedRes.items.map((a) => a.authorId)]);
  const category = cats.get(article.category);
  const more = moreRes.items.filter((a) => a.id !== article.id).slice(0, 3);
  const related = relatedRes.items.filter((a) => a.id !== article.id).slice(0, 3);
  const contentLang = article.language as Locale;
  const contentDir = contentLang === "ur" ? "rtl" : "ltr";
  const tone = categoryTone(article.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": article.type === "research" ? "ScholarlyArticle" : "Article",
    headline: article.title,
    description: article.excerpt,
    inLanguage: article.language,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: author ? { "@type": "Person", name: author.name, url: `${SITE_URL}/${locale}/u/${author.username}` } : undefined,
    publisher: { "@type": "Organization", name: "THE FORUM" },
    keywords: article.tags.join(", "),
    mainEntityOfPage: `${SITE_URL}/${locale}/articles/${article.slug}`,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className={`tone-${tone} relative overflow-hidden pt-8 md:pt-14`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] t-softer [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="container-page relative">
        <Link href={href(locale, "/articles")} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {dict.nav.articles}
        </Link>
        <div className="mx-auto mt-8 max-w-3xl text-center animate-fade-up md:mt-10" lang={contentLang} dir={contentDir}>
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2 md:mb-6">
            <Link href={`${href(locale, "/articles")}?category=${article.category}`} className="badge t-fill hover:opacity-90">
              {category ? lt(category.name, locale) : article.category}
            </Link>
            <Badge tone={typeTone(article.type)}>{dict.articleTypes[article.type]}</Badge>
            {article.editorsPick && <Badge tone="brand">{dict.common.editorsPick}</Badge>}
          </div>
          <h1 className="font-display text-[2.1rem] leading-[1.1] text-ink sm:text-5xl md:text-6xl text-balance">{article.title}</h1>
          {article.subtitle && <p className="mx-auto mt-4 max-w-2xl font-serif text-lg leading-relaxed text-muted sm:text-xl md:mt-6 md:text-2xl text-pretty">{article.subtitle}</p>}
        </div>
        {author && (
          <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted md:mt-10">
            <Link href={href(locale, `/u/${author.username}`)} className="flex items-center gap-3">
              <Avatar user={author} size="md" />
              <span className="text-start">
                <span className="block font-semibold text-ink">{author.name}</span>
                <span className="block text-xs">{author.headline}</span>
              </span>
            </Link>
            <span className="hidden h-8 w-px bg-line sm:block" />
            <span>
              {article.publishedAt && <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale, { day: "numeric", month: "long", year: "numeric" })}</time>}
              {" · "}
              {formatNumber(article.readingMinutes, locale)} {dict.common.minRead}
              {" · "}
              {formatNumber(article.stats.views, locale)} {dict.common.views}
            </span>
          </div>
        )}
        <div className="mx-auto mt-8 max-w-5xl md:mt-12">
          <Cover seed={article.slug} tone={tone} className="aspect-[16/9] w-full shadow-card sm:aspect-[21/9]" rounded="rounded-2xl md:rounded-3xl" />
          {article.coverAlt && <p className="mt-2 text-center text-xs text-muted">{article.coverAlt}</p>}
        </div>
        </div>
      </header>

      <div className="container-page">
        <div className="mx-auto mt-10 max-w-[42rem] md:mt-14">
          <div className="prose-forum" lang={contentLang} dir={contentDir} dangerouslySetInnerHTML={{ __html: article.body }} />

          {article.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap gap-2" aria-label={dict.article.tags}>
              {article.tags.map((t) => (
                <Link key={t} href={`${href(locale, "/articles")}?q=${encodeURIComponent(t)}`} className={`tone-${tone} chip t-text`} lang={contentLang}>
                  #{t}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 border-y border-line py-5">
            <ArticleActions articleId={article.id} likes={article.stats.likes} title={article.title} />
          </div>

          {author && (
            <aside className={`tone-${tone} card relative mt-12 flex flex-col gap-5 overflow-hidden p-6 sm:flex-row sm:p-7`} aria-label={dict.article.about}><span className="absolute inset-x-6 top-0 h-px bg-brand opacity-60" />
              <Avatar user={author} size="lg" />
              <div>
                <p className="eyebrow mb-2">{dict.article.about}</p>
                <Link href={href(locale, `/u/${author.username}`)} className="font-display text-2xl text-ink hover:text-accent">
                  {author.name}
                </Link>
                <p className="mt-1 text-sm text-muted">{author.headline}</p>
                {author.bio && <p className="mt-3 leading-relaxed text-ink-2">{author.bio}</p>}
              </div>
            </aside>
          )}

          <div className="mt-16">
            <CommentSection
              comments={comments}
              authors={commenters}
              locale={locale}
              dict={dict}
              targetType="article"
              targetId={article.id}
              title={dict.article.discussion}
              placeholder={dict.article.commentPlaceholder}
            />
          </div>
        </div>

        {(more.length > 0 || related.length > 0) && (
          <section className="mt-16 border-t border-line pt-12 md:mt-24 md:pt-16">
            <h2 className="mb-10 font-display text-3xl text-ink">{more.length > 0 && author ? `${dict.article.morePieces} ${author.name}` : dict.article.related}</h2>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {(more.length > 0 ? more : related).map((a) => (
                <ArticleCard key={a.id} article={a} author={commenters.get(a.authorId) ?? (author ?? undefined)} category={cats.get(a.category)} locale={locale} dict={dict} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
