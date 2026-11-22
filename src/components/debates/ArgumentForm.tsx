"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ArgumentKind, DebateSide } from "@/types/domain";
import { api } from "@/lib/api/client";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";

export function ArgumentForm({
  debateId,
  sides,
  targets,
  closed,
}: {
  debateId: string;
  sides: { for: string; against: string };
  targets: { id: string; label: string }[];
  closed: boolean;
}) {
  const { dict } = useI18n();
  const t = dict.debate;
  const router = useRouter();
  const [kind, setKind] = useState<ArgumentKind>("argument");
  const [side, setSide] = useState<DebateSide>("for");
  const [parentId, setParentId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const needsParent = kind === "counterargument" || kind === "reply";

  if (closed) {
    return <p className="rounded-xl border border-line bg-bg-subtle p-4 text-sm text-muted">{t.closed}</p>;
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api(
          "POST /api/debates/:id/arguments",
          { kind, side: kind === "solution" ? "neutral" : side, parentId: needsParent ? parentId || undefined : undefined, title: title || undefined, body },
          { id: debateId },
        );
        setState(toActionState(res, "✓"));
        if (res.ok) {
          setTitle("");
          setBody("");
          router.refresh();
        }
      }}
    >
      <fieldset>
        <legend className="label">{t.kind}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["argument", "counterargument", "reply", "solution"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k} className={`btn btn-sm ${kind === k ? "btn-dark" : "btn-outline"}`}>
              {t.kinds[k]}
            </button>
          ))}
        </div>
      </fieldset>
      {kind !== "solution" && (
        <fieldset>
          <legend className="label">{t.side}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["for", "against"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                aria-pressed={side === s}
                className={`btn btn-sm ${side === s ? `btn-tone tone-${s === "for" ? "teal" : "rose"}` : "btn-outline"}`}
              >
                {s === "for" ? sides.for : sides.against}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {needsParent && (
        <div>
          <label className="label" htmlFor="arg-parent">{t.respondingTo}</label>
          <select id="arg-parent" className="field" value={parentId} onChange={(e) => setParentId(e.target.value)} required>
            <option value="">—</option>
            {targets.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="label" htmlFor="arg-title">{t.argTitle}</label>
        <input id="arg-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
      </div>
      <div>
        <label className="sr-only" htmlFor="arg-body">{t.argBody}</label>
        <textarea id="arg-body" className="field" rows={6} required minLength={40} maxLength={5000} placeholder={t.argBody} value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <ActionNotice state={state} />
      <button className="btn btn-primary w-full" disabled={body.trim().length < 40 || state.kind === "pending"}>
        {state.kind === "pending" ? dict.common.loading : dict.common.submit}
      </button>
    </form>
  );
}
