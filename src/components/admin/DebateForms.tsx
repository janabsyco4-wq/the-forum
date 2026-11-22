"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DebateSide, Locale } from "@/types/domain";
import { api } from "@/lib/api/client";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";

const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function DebateForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const { dict } = useI18n();
  const t = dict.admin;
  const router = useRouter();
  const now = new Date();
  const [f, setF] = useState({
    title: "",
    question: "",
    context: "",
    category: categories[0]?.slug ?? "",
    language: "en" as Locale,
    opensAt: toLocalInput(new Date(now.getTime() + 2 * 86400000)),
    closesAt: toLocalInput(new Date(now.getTime() + 9 * 86400000)),
    forLabel: "",
    againstLabel: "",
  });
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api("POST /api/debates", {
          title: f.title,
          question: f.question,
          context: f.context
            .split(/\n{2,}/)
            .map((p) => `<p>${p.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!)}</p>`)
            .join(""),
          category: f.category,
          language: f.language,
          opensAt: new Date(f.opensAt).toISOString(),
          closesAt: new Date(f.closesAt).toISOString(),
          sides: { for: f.forLabel || dict.debate.for, against: f.againstLabel || dict.debate.against },
          readings: [],
        });
        setState(toActionState(res, "✓"));
        if (res.ok) router.refresh();
      }}
    >
      <div>
        <label className="label" htmlFor="df-title">{t.motion}</label>
        <input id="df-title" className="field" required placeholder="This House believes…" value={f.title} onChange={(e) => set("title", e.target.value)} dir={f.language === "ur" ? "rtl" : "ltr"} />
      </div>
      <div>
        <label className="label" htmlFor="df-q">{t.question}</label>
        <input id="df-q" className="field" required value={f.question} onChange={(e) => set("question", e.target.value)} dir={f.language === "ur" ? "rtl" : "ltr"} />
      </div>
      <div>
        <label className="label" htmlFor="df-ctx">{t.context}</label>
        <textarea id="df-ctx" className="field" rows={4} required value={f.context} onChange={(e) => set("context", e.target.value)} dir={f.language === "ur" ? "rtl" : "ltr"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="df-cat">{dict.write.category}</label>
          <select id="df-cat" className="field" value={f.category} onChange={(e) => set("category", e.target.value)}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="df-lang">{dict.write.language}</label>
          <select id="df-lang" className="field" value={f.language} onChange={(e) => set("language", e.target.value)}>
            <option value="en">English</option>
            <option value="ur">اردو</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="df-open">{t.opensAt}</label>
          <input id="df-open" type="datetime-local" className="field" value={f.opensAt} onChange={(e) => set("opensAt", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="df-close">{t.closesAt}</label>
          <input id="df-close" type="datetime-local" className="field" value={f.closesAt} onChange={(e) => set("closesAt", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="df-for">{t.sideFor}</label>
          <input id="df-for" className="field" placeholder={dict.debate.for} value={f.forLabel} onChange={(e) => set("forLabel", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="df-against">{t.sideAgainst}</label>
          <input id="df-against" className="field" placeholder={dict.debate.against} value={f.againstLabel} onChange={(e) => set("againstLabel", e.target.value)} />
        </div>
      </div>
      <ActionNotice state={state} />
      <button className="btn btn-primary w-full" disabled={state.kind === "pending"}>{t.newDebate}</button>
    </form>
  );
}

export function ConclusionForm({ debates }: { debates: { id: string; title: string; sides: { for: string; against: string } }[] }) {
  const { dict } = useI18n();
  const router = useRouter();
  const [id, setId] = useState(debates[0]?.id ?? "");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [verdict, setVerdict] = useState<DebateSide | "">("");
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const debate = debates.find((d) => d.id === id);

  if (debates.length === 0) return <p className="text-sm text-muted">{dict.common.noResults}</p>;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api(
          "POST /api/debates/:id/conclusion",
          {
            summary,
            body: body.split(/\n{2,}/).map((p) => `<p>${p.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!)}</p>`).join(""),
            verdict: verdict || undefined,
          },
          { id },
        );
        setState(toActionState(res, "✓"));
        if (res.ok) router.refresh();
      }}
    >
      <div>
        <label className="label" htmlFor="cf-debate">{dict.admin.debates}</label>
        <select id="cf-debate" className="field" value={id} onChange={(e) => setId(e.target.value)}>
          {debates.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
      </div>
      <fieldset>
        <legend className="label">{dict.debate.verdict}</legend>
        <div className="grid grid-cols-3 gap-2">
          {(["for", "against", "neutral"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={verdict === v} onClick={() => setVerdict(v)} className={`btn btn-sm ${verdict === v ? "btn-dark" : "btn-outline"}`}>
              {v === "neutral" ? dict.debate.sides.neutral : debate?.sides[v]}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="cf-summary">{dict.debate.conclusion}</label>
        <input id="cf-summary" className="field" required value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>
      <div>
        <label className="sr-only" htmlFor="cf-body">{dict.debate.conclusion}</label>
        <textarea id="cf-body" className="field" rows={7} required value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <ActionNotice state={state} />
      <button className="btn btn-dark w-full" disabled={state.kind === "pending"}>{dict.admin.writeConclusion}</button>
    </form>
  );
}
