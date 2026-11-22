"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CommentTarget } from "@/types/domain";
import { api } from "@/lib/api/client";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";

export function CommentForm({ targetType, targetId, parentId, placeholder }: { targetType: CommentTarget; targetId: string; parentId?: string; placeholder: string }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  return (
    <form
      className="card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setState({ kind: "pending" });
        const res = await api("POST /api/comments", { targetType, targetId, parentId, body });
        setState(toActionState(res, "✓"));
        if (res.ok) {
          setBody("");
          router.refresh();
        }
      }}
    >
      <label className="sr-only" htmlFor={`comment-${targetId}`}>
        {placeholder}
      </label>
      <textarea
        id={`comment-${targetId}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={4000}
        placeholder={placeholder}
        className="w-full resize-y bg-transparent leading-relaxed outline-none placeholder:text-faint"
      />
      <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
        <ActionNotice state={state} className="sm:max-w-md" />
        <button className="btn btn-dark btn-sm ms-auto" disabled={!body.trim() || state.kind === "pending"}>
          {state.kind === "pending" ? dict.common.loading : dict.article.postComment}
        </button>
      </div>
    </form>
  );
}
