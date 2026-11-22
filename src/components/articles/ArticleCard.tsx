import Link from "next/link";
import type { Article, Category, Locale, User } from "@/types/domain";
import type { Dictionary } from "@/i18n";
import { formatDate, formatNumber, lt } from "@/i18n";
import { href } from "@/i18n/config";
import { categoryTone, typeTone } from "@/lib/ui/tones";
import { Cover } from "@/components/ui/Cover";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/primitives";

type Props = {
  article: Article;
  author?: User;
  category?: Category;
  locale: Locale;
  dict: Dictionary;
  variant?: "standard" | "feature" | "row" | "compact";
};

function Meta({ article, author, locale, dict, small = false }: Pick<Props, "article" | "author" | "locale" | "dict"> & { small?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${small ? "text-xs" : "text-[0.82rem]"} text-muted`}>
      {author && <Avatar user={author} size={small ? "xs" : "sm"} />}
      <span className="truncate">
        {author && <span className="font-semibold text-ink-2">{author.name}</span>}
        {author && <span className="mx-1.5 text-faint">·</span>}
        {article.publishedAt && <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale, { day: "numeric", month: "short" })}</time>}
        <span className="mx-1.5 text-faint">·</span>
        {formatNumber(article.readingMinutes, locale)} {dict.common.minRead}
      </span>
    </div>
  );
}

export function ArticleCard({ article, author, category, locale, dict, variant = "standard" }: Props) {
  const link = href(locale, `/articles/${article.slug}`);
  const catLabel = category ? lt(category.name, locale) : article.category;
  const typeLabel = dict.articleTypes[article.type];
  const tone = categoryTone(article.category);
  const langAttr = article.language !== locale ? { lang: article.language, dir: article.language === "ur" ? "rtl" : "ltr" } : {};

  if (variant === "feature") {
    return (
      <article className={`tone-${tone} group grid gap-6 md:grid-cols-12 md:items-center md:gap-10`}>
        <Link href={link} className="block md:col-span-7" tabIndex={-1} aria-hidden="true">
          <Cover seed={article.slug} tone={tone} className="aspect-[16/10] w-full shadow-card transition-transform duration-500 group-hover:scale-[1.01]" rounded="rounded-3xl" />
        </Link>
        <div className="min-w-0 md:col-span-5" {...langAttr}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone={tone}>{catLabel}</Badge>
            <Badge tone={typeTone(article.type)}>{typeLabel}</Badge>
          </div>
          <h3 className="font-display text-[1.9rem] leading-[1.15] text-ink md:text-[2.6rem] text-balance">
            <Link href={link} className="link-underline">{article.title}</Link>
          </h3>
          {article.subtitle && <p className="mt-3 font-serif text-lg leading-relaxed text-ink-2 md:mt-4 md:text-xl text-pretty">{article.subtitle}</p>}
          <p className="mt-3 leading-relaxed text-muted line-clamp-3 md:mt-4">{article.excerpt}</p>
          <div className="mt-5 md:mt-6">
            <Meta article={article} author={author} locale={locale} dict={dict} />
          </div>
        </div>
      </article>
    );
  }

  if (variant === "row") {
    return (
      <article className={`tone-${tone} group flex gap-4 py-5 sm:gap-5 sm:py-6`} {...langAttr}>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold t-text">
              <span className="h-1.5 w-1.5 rounded-full t-dot" /> {catLabel}
            </span>
            <span className="text-faint">·</span>
            <span className="text-muted">{typeLabel}</span>
          </div>
          <h3 className="font-display text-lg leading-snug text-ink sm:text-xl md:text-2xl">
            <Link href={link} className="link-underline">{article.title}</Link>
          </h3>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-muted line-clamp-2">{article.excerpt}</p>
          <div className="mt-3 sm:mt-4">
            <Meta article={article} author={author} locale={locale} dict={dict} small />
          </div>
        </div>
        <Link href={link} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <Cover seed={article.slug} tone={tone} className="h-20 w-20 sm:h-32 sm:w-44 md:h-36 md:w-52" rounded="rounded-xl" />
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={`tone-${tone} group flex gap-4`} {...langAttr}>
        <Cover seed={article.slug} tone={tone} className="h-16 w-16 shrink-0" rounded="rounded-xl" />
        <div className="min-w-0">
          <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wider t-text">{catLabel}</p>
          <h3 className="font-display text-[1.05rem] leading-snug text-ink line-clamp-2">
            <Link href={link} className="link-underline">{article.title}</Link>
          </h3>
          <p className="mt-1 text-xs text-muted">{author?.name}</p>
        </div>
      </article>
    );
  }

  return (
    <article className={`tone-${tone} card card-hover group flex h-full flex-col overflow-hidden`} {...langAttr}>
      <Link href={link} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <Cover seed={article.slug} tone={tone} label={typeLabel} className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.04]" rounded="rounded-none" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow mb-2.5 inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full t-dot" /> {catLabel}
        </p>
        <h3 className="font-display text-[1.35rem] leading-[1.22] text-ink text-balance">
          <Link href={link} className="link-underline">{article.title}</Link>
        </h3>
        <p className="mt-2.5 text-[0.93rem] leading-relaxed text-muted line-clamp-3">{article.excerpt}</p>
        <div className="mt-auto pt-5">
          <div className="border-t border-line pt-4">
            <Meta article={article} author={author} locale={locale} dict={dict} small />
          </div>
        </div>
      </div>
    </article>
  );
}
