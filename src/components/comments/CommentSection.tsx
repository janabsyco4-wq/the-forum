import type { Comment, CommentTarget, Locale, User } from "@/types/domain";
import type { Dictionary } from "@/i18n";
import { timeAgo, formatNumber } from "@/i18n";
import { Avatar } from "@/components/ui/Avatar";
import { CommentForm } from "./CommentForm";
import { ReportButton } from "@/components/moderation/ReportButton";
import { Heart } from "lucide-react";

function CommentItem({ c, authors, locale, dict, replies }: { c: Comment; authors: Map<string, User>; locale: Locale; dict: Dictionary; replies: Comment[] }) {
  const a = authors.get(c.authorId);
  return (
    <li className="py-6">
      <div className="flex gap-4">
        {a && <Avatar user={a} size="md" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-semibold text-ink">{a?.name}</span>
            {a?.headline && <span className="text-xs text-faint">{a.headline}</span>}
            <span className="text-xs text-faint">· {timeAgo(c.createdAt, locale)}</span>
          </div>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-2">{c.body}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {formatNumber(c.likes, locale)}
            </span>
            <ReportButton targetType="comment" targetId={c.id} preview={c.body.slice(0, 120)} compact />
          </div>
          {replies.length > 0 && (
            <ul className="mt-2 border-s-2 border-line ps-5">
              {replies.map((r) => (
                <CommentItem key={r.id} c={r} authors={authors} locale={locale} dict={dict} replies={[]} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export function CommentSection({
  comments,
  authors,
  locale,
  dict,
  targetType,
  targetId,
  title,
  placeholder,
}: {
  comments: Comment[];
  authors: Map<string, User>;
  locale: Locale;
  dict: Dictionary;
  targetType: CommentTarget;
  targetId: string;
  title: string;
  placeholder: string;
}) {
  const roots = comments.filter((c) => !c.parentId);
  return (
    <section aria-labelledby="comments-title">
      <h2 id="comments-title" className="font-display text-2xl text-ink">
        {title} <span className="text-faint">({formatNumber(comments.length, locale)})</span>
      </h2>
      <p className="mt-1 text-sm text-muted">{dict.article.commentGuidelines}</p>
      <div className="mt-6">
        <CommentForm targetType={targetType} targetId={targetId} placeholder={placeholder} />
      </div>
      <ul className="mt-4 divide-y divide-line">
        {roots.map((c) => (
          <CommentItem key={c.id} c={c} authors={authors} locale={locale} dict={dict} replies={comments.filter((r) => r.parentId === c.id)} />
        ))}
      </ul>
    </section>
  );
}
