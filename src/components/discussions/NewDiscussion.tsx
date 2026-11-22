"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { DiscussionTopic, Locale } from "@/types/domain";
import { api } from "@/lib/api/client";
import { href } from "@/i18n/config";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";

export function NewDiscussion({ topics }: { topics: DiscussionTopic[] }) {
  const { dict, locale } = useI18n();
  const t = dict.discussions;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<DiscussionTopic>("current-affairs");
  const [language, setLanguage] = useState<Locale>(locale);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<ActionState>({ kind: "idle" });

  if (!open)
    return (
      <button type="button" className="btn btn-primary btn-lg" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> {t.start}
      </button>
    );

  return (
    <form
      className="card max-w-2xl space-y-4 p-6 animate-fade-up"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api("POST /api/discussions", { title, body, topic, language });
        setState(toActionState(res, "✓"));
        if (res.ok) router.push(href(locale, `/discussions/${res.data.slug}`));
      }}
    >
      <h2 className="font-display text-2xl text-ink">{t.startTitle}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nd-topic">{t.topic}</label>
          <select id="nd-topic" className="field" value={topic} onChange={(e) => setTopic(e.target.value as DiscussionTopic)}>
            {topics.map((x) => (
              <option key={x} value={x}>{dict.topics[x]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="nd-lang">{dict.write.language}</label>
          <select id="nd-lang" className="field" value={language} onChange={(e) => setLanguage(e.target.value as Locale)}>
            <option value="en">English</option>
            <option value="ur">اردو</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="nd-title">{t.titleLabel}</label>
        <input id="nd-title" className="field" required minLength={10} maxLength={160} placeholder={t.titlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} dir={language === "ur" ? "rtl" : "ltr"} />
      </div>
      <div>
        <label className="label" htmlFor="nd-body">{t.bodyLabel}</label>
        <textarea id="nd-body" className="field" rows={5} required minLength={30} placeholder={t.bodyPlaceholder} value={body} onChange={(e) => setBody(e.target.value)} dir={language === "ur" ? "rtl" : "ltr"} />
        <p className="mt-1.5 text-xs text-faint">{t.rules}</p>
      </div>
      <ActionNotice state={state} />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>{dict.common.cancel}</button>
        <button className="btn btn-primary" disabled={state.kind === "pending"}>{t.start}</button>
      </div>
    </form>
  );
}
