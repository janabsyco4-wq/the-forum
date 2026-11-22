"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import type { Locale } from "@/types/domain";
import { api } from "@/lib/api/client";
import { href } from "@/i18n/config";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";
import { GoogleButton, landingFor } from "./AccountForms";

function PasswordInput({ id, value, onChange, autoComplete, invalid }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; invalid?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} required minLength={autoComplete === "new-password" ? 10 : 1} autoComplete={autoComplete} className="field pe-11" dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute end-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-faint hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** After sign-in/up: unconfirmed emails go to the verify screen first, then on to the usual landing page. */
function afterAuth(user: { role: string; emailVerified: boolean; preferredLocale?: Locale }, locale: Locale, next: string | null | undefined) {
  const dest = landingFor(user, locale, next);
  if (user.emailVerified) return dest;
  return `${href(user.preferredLocale ?? locale, "/verify-email")}?next=${encodeURIComponent(dest)}`;
}

export function LoginForm({ next }: { next?: string | null }) {
  const { dict, locale } = useI18n();
  const t = dict.auth;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  return (
    <>
    <GoogleButton next={next} />
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api("POST /api/auth/login", { email, password });
        setState(toActionState(res, "✓"));
        if (res.ok) {
          router.replace(afterAuth(res.data, locale, next));
          router.refresh();
        }
      }}
    >
      <div>
        <label className="label" htmlFor="login-email">{t.email}</label>
        <input id="login-email" type="email" required autoComplete="email" className="field" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="label" htmlFor="login-password">{t.password}</label>
          <Link href={href(locale, "/forgot-password")} className="mb-1.5 text-xs font-medium text-accent hover:underline">{t.forgot}</Link>
        </div>
        <PasswordInput id="login-password" value={password} onChange={setPassword} autoComplete="current-password" />
      </div>
      <ActionNotice state={state} />
      <button className="btn btn-primary btn-lg w-full" disabled={state.kind === "pending"}>
        {state.kind === "pending" ? dict.common.loading : t.signIn}
      </button>
      <p className="text-center text-sm text-muted">
        {t.noAccount}{" "}
        <Link href={href(locale, next ? `/register?next=${encodeURIComponent(next)}` : "/register")} className="font-medium text-accent hover:underline">{t.createAccount}</Link>
      </p>
    </form>
    </>
  );
}

export function RegisterForm({ next }: { next?: string | null }) {
  const { dict, locale } = useI18n();
  const t = dict.auth;
  const router = useRouter();
  const [f, setF] = useState({ name: "", username: "", email: "", password: "", university: "", preferredLocale: locale as Locale });
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameWarn, setUsernameWarn] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const err = (k: string) => errors[k] && <p className="mt-1.5 text-xs text-danger">{errors[k]}</p>;

  return (
    <>
    <GoogleButton next={next} />
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api("POST /api/auth/register", { ...f, university: f.university || undefined });
        setErrors(!res.ok && res.error.fields ? res.error.fields : {});
        setState(toActionState(res, "✓"));
        if (res.ok) {
          router.replace(afterAuth(res.data, locale, next));
          router.refresh();
        }
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="reg-name">{t.name}</label>
          <input id="reg-name" required autoComplete="name" className="field" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
          {err("name")}
        </div>
        <div>
          <label className="label" htmlFor="reg-username">{t.username}</label>
          <input
            id="reg-username"
            required
            pattern="[a-z0-9_-]{3,30}"
            placeholder="ali_khan"
            autoComplete="username"
            className="field"
            dir="ltr"
            value={f.username}
            onChange={(e) => {
              const raw = e.target.value.toLowerCase();
              setUsernameWarn(/[^a-z0-9_-]/.test(raw));
              set("username", raw.replace(/[^a-z0-9_-]/g, "").slice(0, 30));
            }}
            aria-invalid={!!errors.username}
          />
          {errors.username ? err("username") : <p className={`mt-1.5 text-xs ${usernameWarn ? "text-warning" : "text-faint"}`}>{t.usernameHint}</p>}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="reg-email">{t.email}</label>
        <input id="reg-email" type="email" required autoComplete="email" className="field" dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
        {err("email")}
      </div>
      <div>
        <label className="label" htmlFor="reg-password">{t.password}</label>
        <PasswordInput id="reg-password" value={f.password} onChange={(v) => set("password", v)} autoComplete="new-password" invalid={!!errors.password} />
        {errors.password ? err("password") : <p className="mt-1.5 text-xs text-faint">{t.passwordHint}</p>}
      </div>
      <div>
        <label className="label" htmlFor="reg-uni">{t.university}</label>
        <input id="reg-uni" className="field" value={f.university} onChange={(e) => set("university", e.target.value)} />
      </div>
      <fieldset>
        <legend className="label">{t.preferredLanguage}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["en", "ur"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={f.preferredLocale === l} onClick={() => set("preferredLocale", l)} className={`btn ${f.preferredLocale === l ? "btn-dark" : "btn-outline"}`}>
              {l === "en" ? "English" : "اردو"}
            </button>
          ))}
        </div>
      </fieldset>
      <ActionNotice state={state} />
      <button className="btn btn-primary btn-lg w-full" disabled={state.kind === "pending"}>
        {state.kind === "pending" ? dict.common.loading : t.createAccount}
      </button>
      <p className="text-center text-xs text-faint">{t.terms}</p>
      <p className="text-center text-sm text-muted">
        {t.haveAccount}{" "}
        <Link href={href(locale, next ? `/login?next=${encodeURIComponent(next)}` : "/login")} className="font-medium text-accent hover:underline">{t.signIn}</Link>
      </p>
    </form>
    </>
  );
}
