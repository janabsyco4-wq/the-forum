"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bold, Eye, Heading2, Heading3, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, PenLine, Quote, RemoveFormatting, Save, Send, X } from "lucide-react";
import type { Article, ArticleType, Category, Locale } from "@/types/domain";
import { api } from "@/lib/api/client";
import { href } from "@/i18n/config";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";
import { Cover } from "@/components/ui/Cover";
import { formatNumber, lt } from "@/i18n";

const NEW_DRAFT_KEY = "forum_draft_v1";
const TYPES: ArticleType[] = ["essay", "article", "opinion", "blog", "research"];

type Draft = {
  title: string;
  subtitle: string;
  body: string;
  type: ArticleType;
  category: string;
  language: Locale;
  tags: string;
  excerpt: string;
  coverAlt: string;
  savedAt?: string;
};

export function WriteEditor({ categories, initial = null }: { categories: Category[]; initial?: Article | null }) {
  const { dict, locale } = useI18n();
  const t = dict.write;
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [draft, setDraft] = useState<Draft>(
    initial
      ? {
          title: initial.title, subtitle: initial.subtitle ?? "", body: initial.body, type: initial.type, category: initial.category,
          language: initial.language, tags: initial.tags.join(", "), excerpt: initial.excerpt ?? "", coverAlt: initial.coverAlt ?? "",
        }
      : { title: "", subtitle: "", body: "", type: "essay", category: categories[0]?.slug ?? "", language: locale, tags: "", excerpt: "", coverAlt: "" },
  );
  // Server id once the piece exists in the database — later saves update it instead of creating copies.
  const [articleId, setArticleId] = useState<string | null>(initial?.id ?? null);
  // Cover: uploaded right away; we keep the server URL (and a local preview while uploading).
  const [cover, setCover] = useState<{ url: string; uploading?: boolean } | null>(initial?.coverImage ? { url: initial.coverImage } : null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const [saved, setSaved] = useState<string | null>(null);
  const loaded = useRef(false);
  const DRAFT_KEY = initial ? `forum_draft_${initial.id}` : NEW_DRAFT_KEY;

  // Fill the editor: the server copy when editing, otherwise any local backup.
  useEffect(() => {
    if (initial) {
      if (editorRef.current) editorRef.current.innerHTML = initial.body;
    } else {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw) as Draft & { articleId?: string };
          setDraft(d);
          if (d.articleId) setArticleId(d.articleId);
          if (editorRef.current) editorRef.current.innerHTML = d.body;
          if (d.savedAt) setSaved(d.savedAt);
        }
      } catch {}
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(
    (d: Draft) => {
      try {
        const savedAt = new Date().toISOString();
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, savedAt, articleId }));
        setSaved(savedAt);
      } catch {}
    },
    [DRAFT_KEY, articleId],
  );

  async function chooseCover(file: File) {
    setCoverError(null);
    if (file.size > 5 * 1024 * 1024) return setCoverError(t.uploadFailed + " (max 5 MB)");
    setCover({ url: URL.createObjectURL(file), uploading: true });
    const fd = new FormData();
    fd.append("file", file);
    const up = await api("POST /api/uploads", fd);
    if (up.ok) setCover({ url: up.data.url });
    else {
      setCover(null);
      setCoverError(up.error.code === "NOT_IMPLEMENTED" ? dict.prototype.notSaved : `${t.uploadFailed}: ${up.error.message}`);
    }
  }

  // Debounced autosave to this device.
  useEffect(() => {
    if (!loaded.current) return;
    const id = setTimeout(() => persist(draft), 1200);
    return () => clearTimeout(id);
  }, [draft, persist]);

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const syncBody = () => update("body", editorRef.current?.innerHTML ?? "");

  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    syncBody();
  };

  const plain = draft.body.replace(/<[^>]+>/g, " ");
  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(wordCount / (draft.language === "ur" ? 160 : 210)));
  const dir = draft.language === "ur" ? "rtl" : "ltr";

  const tools = [
    { icon: Bold, label: t.toolbar.bold, run: () => exec("bold") },
    { icon: Italic, label: t.toolbar.italic, run: () => exec("italic") },
    { icon: Heading2, label: t.toolbar.h2, run: () => exec("formatBlock", "<h2>") },
    { icon: Heading3, label: t.toolbar.h3, run: () => exec("formatBlock", "<h3>") },
    { icon: Quote, label: t.toolbar.quote, run: () => exec("formatBlock", "<blockquote>") },
    { icon: List, label: t.toolbar.ul, run: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: t.toolbar.ol, run: () => exec("insertOrderedList") },
    {
      icon: LinkIcon,
      label: t.toolbar.link,
      run: () => {
        const url = window.prompt(t.toolbar.linkPrompt, "https://");
        if (url && /^https?:\/\//.test(url)) exec("createLink", url);
      },
    },
    { icon: RemoveFormatting, label: t.toolbar.clear, run: () => { exec("removeFormat"); exec("formatBlock", "<p>"); } },
  ];

  async function submit(kind: "draft" | "publish") {
    const body = editorRef.current?.innerHTML ?? draft.body;
    persist({ ...draft, body });
    if (cover?.uploading) return;
    setState({ kind: "pending" });
    const input = {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim() || undefined,
      excerpt: draft.excerpt.trim() || undefined,
      body,
      type: draft.type,
      category: draft.category,
      tags: draft.tags.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5),
      language: draft.language,
      coverImage: cover && !cover.uploading ? cover.url : undefined,
      coverAlt: draft.coverAlt || undefined,
    };
    // Create once, then keep updating the same article.
    const saved = articleId ? await api("PATCH /api/articles/:id", input, { id: articleId }) : await api("POST /api/articles", input);
    if (!saved.ok) return setState(toActionState(saved, ""));
    setArticleId(saved.data.id);
    if (kind === "draft") {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, body, savedAt: new Date().toISOString(), articleId: saved.data.id }));
      } catch {}
      return setState({ kind: "success", message: t.savedToAccount });
    }
    const submitted = await api("POST /api/articles/:id/submit", undefined, { id: saved.data.id });
    if (!submitted.ok) return setState(toActionState(submitted, ""));
    // Done: forget the local backup and show it where it now lives.
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    const published = submitted.data.status === "published";
    setState({ kind: "success", message: published ? t.publishedNow : t.submitted });
    router.push(published ? href(locale, `/articles/${submitted.data.slug}`) : `${href(locale, "/dashboard")}?tab=pending`);
    router.refresh();
  }

  const canSubmit = draft.title.trim().length > 3 && wordCount > 20;

  return (
    <div className="grid grid-cols-1 gap-8 pb-20 lg:grid-cols-12 lg:gap-10 lg:pb-0">
      {/* ── Main column ── */}
      <div className="min-w-0 lg:col-span-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-line bg-surface p-1" role="tablist">
            {(["edit", "preview"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => {
                  syncBody();
                  setTab(k);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${tab === k ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
              >
                {k === "edit" ? <PenLine className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {k === "edit" ? t.edit : t.preview}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted" aria-live="polite">
            {formatNumber(wordCount, locale, false)} {t.words} · {formatNumber(minutes, locale)} {t.readTime}
            {saved && <span className="hidden sm:inline"> · {t.backupNote}</span>}
          </p>
        </div>

        <div className={tab === "edit" ? "block" : "hidden"}>
          <div className="card overflow-hidden">
            {cover ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cover.url} alt={draft.coverAlt} className={`aspect-[21/9] w-full object-cover ${cover.uploading ? "opacity-60" : ""}`} />
                {cover.uploading ? (
                  <span className="badge absolute start-3 top-3 bg-surface/90 text-ink">{t.uploading}</span>
                ) : (
                  <button type="button" onClick={() => setCover(null)} className="btn btn-sm absolute end-3 top-3 bg-surface/90 text-ink">
                    <X className="h-3.5 w-3.5" /> {t.coverRemove}
                  </button>
                )}
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1 border-b border-dashed border-line-strong bg-bg-subtle py-8 text-sm text-muted hover:text-ink">
                <span className="inline-flex items-center gap-2"><ImagePlus className="h-4 w-4" /> {t.coverChoose}</span>
                {coverError && <span className="text-xs text-danger">{coverError}</span>}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) chooseCover(f);
                  }}
                />
              </label>
            )}
            <div className="px-6 pt-8 md:px-12" dir={dir} lang={draft.language}>
              <label htmlFor="w-title" className="sr-only">{t.titlePlaceholder}</label>
              <textarea
                id="w-title"
                rows={1}
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder={t.titlePlaceholder}
                className="w-full resize-none bg-transparent font-display text-4xl leading-tight text-ink outline-none placeholder:text-faint md:text-5xl [field-sizing:content]"
              />
              <label htmlFor="w-subtitle" className="sr-only">{t.subtitlePlaceholder}</label>
              <textarea
                id="w-subtitle"
                rows={1}
                value={draft.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
                placeholder={t.subtitlePlaceholder}
                className="mt-3 w-full resize-none bg-transparent font-serif text-xl leading-relaxed text-muted outline-none placeholder:text-faint [field-sizing:content]"
              />
            </div>
            <div className="sticky top-16 z-10 mt-6 flex flex-wrap gap-0.5 border-y border-line bg-surface/95 px-4 py-2 backdrop-blur md:px-10" role="toolbar" aria-label="Formatting">
              {tools.map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  title={tool.label}
                  aria-label={tool.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={tool.run}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink"
                >
                  <tool.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label={t.bodyPlaceholder}
              data-placeholder={t.bodyPlaceholder}
              dir={dir}
              lang={draft.language}
              onInput={syncBody}
              onBlur={syncBody}
              onPaste={(e) => {
                // Keep the document clean: paste as plain text.
                e.preventDefault();
                document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
              }}
              className="prose-forum editor-surface min-h-[28rem] px-6 py-8 outline-none md:px-12"
            />
          </div>
        </div>

        {tab === "preview" && (
          <div className="card px-6 py-12 md:px-14" lang={draft.language} dir={dir}>
            <p className="eyebrow mb-4">{lt(categories.find((c) => c.slug === draft.category)?.name ?? { en: "" }, locale)} · {dict.articleTypes[draft.type]}</p>
            <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">{draft.title || t.titlePlaceholder}</h1>
            {draft.subtitle && <p className="mt-4 font-serif text-xl text-muted">{draft.subtitle}</p>}
            <div className="my-8">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover.url} alt={draft.coverAlt} className="aspect-[21/9] w-full rounded-2xl object-cover" />
              ) : (
                <Cover seed={draft.title || "draft"} className="aspect-[21/9] w-full" />
              )}
            </div>
            <div className="prose-forum mx-auto max-w-[40rem]" dangerouslySetInnerHTML={{ __html: draft.body || `<p>${t.bodyPlaceholder}</p>` }} />
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="lg:col-span-4">
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="card hidden p-6 lg:block">
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => submit("publish")} disabled={!canSubmit || state.kind === "pending"} className="btn btn-brand btn-lg w-full">
                <Send className="h-4 w-4 rtl:-scale-x-100" /> {t.publish}
              </button>
              <button type="button" onClick={() => submit("draft")} disabled={state.kind === "pending"} className="btn btn-outline w-full">
                <Save className="h-4 w-4" /> {t.saveDraft}
              </button>
            </div>
            {!canSubmit && <p className="mt-3 text-center text-xs text-faint">{t.needsMore}</p>}
            <ActionNotice state={state} className="mt-4" />
            {saved && (
              <p className="mt-3 text-center text-xs text-faint" suppressHydrationWarning>
                {t.lastSaved}: {new Date(saved).toLocaleTimeString(locale === "ur" ? "ur-PK" : "en-GB", { hour: "2-digit", minute: "2-digit" })} · {t.backupNote}
              </p>
            )}
          </div>

          <div className="card space-y-5 p-6">
            <p className="font-display text-lg text-ink">{t.settings}</p>
            <div>
              <span className="label">{t.language}</span>
              <div className="grid grid-cols-2 gap-2">
                {(["en", "ur"] as const).map((l) => (
                  <button key={l} type="button" onClick={() => update("language", l)} className={`btn btn-sm ${draft.language === l ? "btn-dark" : "btn-outline"}`}>
                    {l === "en" ? "English" : "اردو"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="w-type">{t.format}</label>
              <select id="w-type" className="field" value={draft.type} onChange={(e) => update("type", e.target.value as ArticleType)}>
                {TYPES.map((x) => <option key={x} value={x}>{dict.articleTypes[x]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="w-cat">{t.category}</label>
              <select id="w-cat" className="field" value={draft.category} onChange={(e) => update("category", e.target.value)}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{lt(c.name, locale)}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="w-tags">{t.tags}</label>
              <input id="w-tags" className="field" value={draft.tags} onChange={(e) => update("tags", e.target.value)} placeholder="education, reform" />
              <p className="mt-1.5 text-xs text-faint">{t.tagsHint}</p>
            </div>
            <div>
              <label className="label" htmlFor="w-excerpt">{t.excerpt}</label>
              <textarea id="w-excerpt" className="field" rows={3} maxLength={220} value={draft.excerpt} onChange={(e) => update("excerpt", e.target.value)} />
              <p className="mt-1.5 text-xs text-faint">{t.excerptHint}</p>
            </div>
            {cover && (
              <div>
                <label className="label" htmlFor="w-alt">{t.coverAlt}</label>
                <input id="w-alt" className="field" value={draft.coverAlt} onChange={(e) => update("coverAlt", e.target.value)} />
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6">
            <span className="absolute inset-x-6 top-0 h-px bg-brand opacity-60" />
            <p className="font-display text-lg text-ink">{t.guidelines}</p>
            <ul className="mt-3 space-y-2.5 text-sm text-muted">
              {t.guidelinesList.map((g, i) => (
                <li key={g} className={`tone-${(["indigo", "rose", "amber", "emerald"] as const)[i % 4]} flex gap-2.5`}>
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full t-pill text-[0.65rem] font-bold">{i + 1}</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Phones/tablets: actions stay within thumb reach, above the bottom navigation. */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-line bg-surface/95 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        {state.kind !== "idle" && <ActionNotice state={state} className="mx-auto mb-2 max-w-2xl" />}
        <div className="mx-auto flex max-w-2xl gap-2">
          <button type="button" onClick={() => submit("draft")} disabled={state.kind === "pending"} className="btn btn-outline flex-1">
            <Save className="h-4 w-4" /> {t.saveDraft}
          </button>
          <button type="button" onClick={() => submit("publish")} disabled={!canSubmit || state.kind === "pending"} className="btn btn-brand flex-[1.4]">
            <Send className="h-4 w-4 rtl:-scale-x-100" /> {t.publish}
          </button>
        </div>
      </div>
    </div>
  );
}
