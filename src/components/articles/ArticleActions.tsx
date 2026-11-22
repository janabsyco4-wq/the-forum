"use client";

import { useState } from "react";
import { Bookmark, Heart, Link2, Share2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, type ActionState } from "@/components/ui/ActionNotice";
import { ReportButton } from "@/components/moderation/ReportButton";
import { formatNumber } from "@/i18n";

export function ArticleActions({ articleId, likes, title }: { articleId: string; likes: number; title: string }) {
  const { dict, locale } = useI18n();
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState(likes);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={liked}
          className={`btn btn-outline btn-sm ${liked ? "border-accent text-accent" : ""}`}
          onClick={async () => {
            const res = await api("POST /api/articles/:id/like", undefined, { id: articleId });
            if (res.ok) {
              setCount(res.data.likes);
              setLiked(res.data.liked);
              setState({ kind: "idle" });
            } else setState(res.error.code === "NOT_IMPLEMENTED" ? { kind: "prototype" } : { kind: "error", message: res.error.message });
          }}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {formatNumber(count, locale)}
        </button>
        <button
          type="button"
          aria-pressed={bookmarked}
          className={`btn btn-outline btn-sm ${bookmarked ? "border-accent text-accent" : ""}`}
          onClick={async () => {
            const res = await api("POST /api/articles/:id/bookmark", undefined, { id: articleId });
            if (res.ok) {
              setBookmarked(res.data.bookmarked);
              setState({ kind: "idle" });
            } else setState(res.error.code === "NOT_IMPLEMENTED" ? { kind: "prototype" } : { kind: "error", message: res.error.message });
          }}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} /> {dict.common.bookmark}
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={async () => {
            const url = window.location.href;
            if (navigator.share) {
              try {
                await navigator.share({ title, url });
              } catch {}
            } else {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
        >
          {copied ? <Link2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />} {copied ? "✓" : dict.common.share}
        </button>
        <ReportButton targetType="article" targetId={articleId} />
      </div>
      <ActionNotice state={state} />
    </div>
  );
}
