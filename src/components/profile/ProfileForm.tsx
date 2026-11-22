"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, User } from "@/types/domain";
import { api } from "@/lib/api/client";
import { lt } from "@/i18n";
import { useI18n } from "@/components/providers/I18nProvider";
import { Avatar } from "@/components/ui/Avatar";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";

export function ProfileForm({ user, categories }: { user: User; categories: Category[] }) {
  const { dict, locale } = useI18n();
  const t = dict.profile;
  const router = useRouter();
  const [f, setF] = useState({
    name: user.name,
    headline: user.headline ?? "",
    bio: user.bio ?? "",
    university: user.university ?? "",
    city: user.city ?? "",
    country: user.country ?? "",
    website: user.website ?? "",
    interests: user.interests,
  });
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const [avatarState, setAvatarState] = useState<ActionState>({ kind: "idle" });
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const field = (k: "name" | "headline" | "university" | "city" | "country" | "website", label: string, hint?: string, type = "text") => (
    <div>
      <label className="label" htmlFor={`pf-${k}`}>{label}</label>
      <input id={`pf-${k}`} type={type} className="field" value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]} dir={k === "website" ? "ltr" : undefined} />
      {(errors[k] || hint) && <p className={`mt-1.5 text-xs ${errors[k] ? "text-danger" : "text-faint"}`}>{errors[k] ?? hint}</p>}
    </div>
  );

  return (
    <form
      className="mt-10 space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api("PATCH /api/users/me", { ...f, website: f.website || undefined });
        setErrors(!res.ok && res.error.fields ? res.error.fields : {});
        setState(toActionState(res, "✓"));
        if (res.ok) router.refresh();
      }}
    >
      <div className="card flex items-center gap-5 p-6">
        <Avatar user={{ ...user, avatarUrl }} size="lg" />
        <div className="min-w-0">
          <p className="font-medium text-ink">{t.avatar}</p>
          <label className={`btn btn-outline btn-sm mt-2 cursor-pointer ${avatarState.kind === "pending" ? "pointer-events-none opacity-60" : ""}`}>
            {avatarState.kind === "pending" ? dict.write.uploading : dict.write.coverChoose}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setAvatarState({ kind: "pending" });
                const fd = new FormData();
                fd.append("file", file);
                const up = await api("POST /api/uploads", fd);
                if (!up.ok) return setAvatarState(toActionState(up, ""));
                const res = await api("PATCH /api/users/me", { avatarUrl: up.data.url });
                setAvatarState(toActionState(res, "✓"));
                if (res.ok) {
                  setAvatarUrl(up.data.url);
                  router.refresh();
                }
              }}
            />
          </label>
          <ActionNotice state={avatarState} className="mt-2" />
        </div>
      </div>

      <div className="card grid gap-5 p-6 md:grid-cols-2">
        {field("name", t.name)}
        {field("headline", t.headline, t.headlineHint)}
        <div className="md:col-span-2">
          <label className="label" htmlFor="pf-bio">{t.bio}</label>
          <textarea id="pf-bio" className="field" rows={5} maxLength={600} value={f.bio} onChange={(e) => set("bio", e.target.value)} />
          <p className="mt-1.5 text-xs text-faint">{t.bioHint}</p>
        </div>
        {field("university", t.university)}
        {field("city", t.city)}
        {field("website", t.website, undefined, "url")}
      </div>

      <fieldset className="card p-6">
        <legend className="sr-only">{t.interests}</legend>
        <p className="label">{t.interests}</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = f.interests.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={on}
                onClick={() => setF((x) => ({ ...x, interests: on ? x.interests.filter((i) => i !== c.slug) : [...x.interests, c.slug] }))}
                className={`chip ${on ? "chip-active" : ""}`}
              >
                {lt(c.name, locale)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ActionNotice state={state} className="sm:max-w-md" />
        <button className="btn btn-primary btn-lg ms-auto" disabled={state.kind === "pending"}>
          {t.saveProfile}
        </button>
      </div>
    </form>
  );
}
