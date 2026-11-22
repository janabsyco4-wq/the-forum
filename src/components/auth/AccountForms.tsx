"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import type { Locale } from "@/types/domain";
import type { GoogleAuthError } from "@/lib/api/contract";
import { api } from "@/lib/api/client";
import { href } from "@/i18n/config";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/** Where a signed-in user goes next: the requested page, else /admin for staff, /dashboard for everyone else. */
export function landingFor(user: { role: string; preferredLocale?: Locale }, locale: Locale, next?: string | null) {
  if (next) return next;
  return href(user.preferredLocale ?? locale, user.role === "admin" || user.role === "moderator" ? "/admin" : "/dashboard");
}

function CodeInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  return (
    <input
      id={id}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      required
      dir="ltr"
      className="field h-14 text-center font-mono text-2xl tracking-[0.5em]"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
    />
  );
}

function useCooldown() {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= now) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [until, now]);
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  return { left, start: (s = 60) => { setNow(Date.now()); setUntil(Date.now() + s * 1000); } };
}

// ───────────────────────── Verify email ─────────────────────────

export function VerifyEmailForm({ email, next }: { email: string; next?: string | null }) {
  const { dict, locale } = useI18n();
  const t = dict.auth;
  const router = useRouter();
  const [code, setCode] = useState("");
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const [info, setInfo] = useState<string | null>(null);
  const cooldown = useCooldown();

  async function resend() {
    setInfo(null);
    const res = await api("POST /api/auth/resend-verification");
    if (res.ok) {
      setInfo(res.data.delivery === "dev-console" ? t.devConsole : fill(t.resent, { email: res.data.sentTo }));
      cooldown.start(60);
    } else {
      setState(toActionState(res, ""));
      if (res.error.code === "RATE_LIMITED") cooldown.start(60);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api("POST /api/auth/verify-email", { code });
        setState(toActionState(res, t.verified));
        if (res.ok) {
          router.replace(landingFor(res.data, locale, next));
          router.refresh();
        }
      }}
    >
      <p className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-2">
        <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <span>{fill(t.verifyBody, { email })}</span>
      </p>
      <div>
        <label className="label" htmlFor="verify-code">{t.codeLabel}</label>
        <CodeInput id="verify-code" value={code} onChange={setCode} />
      </div>
      {info && <p className="rounded-xl bg-info-soft px-4 py-3 text-sm text-info">{info}</p>}
      <ActionNotice state={state} />
      <button className="btn btn-primary btn-lg w-full" disabled={state.kind === "pending" || code.length !== 6}>
        {state.kind === "pending" ? dict.common.loading : t.verify}
      </button>
      <button type="button" className="btn btn-ghost w-full" disabled={cooldown.left > 0} onClick={resend}>
        {cooldown.left > 0 ? fill(t.resendIn, { s: cooldown.left }) : t.resend}
      </button>
    </form>
  );
}

// ───────────────────────── Forgot / reset password ─────────────────────────

export function ForgotPasswordForm({ initialEmail = "" }: { initialEmail?: string }) {
  const { dict, locale } = useI18n();
  const t = dict.auth;
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<string | null>(null);
  const cooldown = useCooldown();

  async function sendCode() {
    setState({ kind: "pending" });
    const res = await api("POST /api/auth/forgot-password", { email });
    if (!res.ok) return setState(toActionState(res, ""));
    setState({ kind: "idle" });
    setInfo(res.data.delivery === "dev-console" ? t.devConsole : fill(t.codeSent, { email }));
    setStep("reset");
    cooldown.start(60);
  }

  if (step === "email")
    return (
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          sendCode();
        }}
      >
        <div>
          <label className="label" htmlFor="fp-email">{t.email}</label>
          <input id="fp-email" type="email" required autoComplete="email" dir="ltr" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <ActionNotice state={state} />
        <button className="btn btn-primary btn-lg w-full" disabled={state.kind === "pending"}>
          {state.kind === "pending" ? dict.common.loading : t.sendCode}
        </button>
        <p className="text-center text-sm">
          <Link href={href(locale, "/login")} className="font-medium text-accent hover:underline">{t.backToLogin}</Link>
        </p>
      </form>
    );

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api("POST /api/auth/reset-password", { email, code, password });
        setErrors(!res.ok && res.error.fields ? res.error.fields : {});
        setState(toActionState(res, "✓"));
        if (res.ok) {
          router.replace(landingFor(res.data, locale));
          router.refresh();
        }
      }}
    >
      {info && <p className="rounded-xl bg-info-soft px-4 py-3 text-sm text-info">{info}</p>}
      <div>
        <label className="label" htmlFor="fp-code">{t.codeLabel}</label>
        <CodeInput id="fp-code" value={code} onChange={setCode} />
        {errors.code && <p className="mt-1.5 text-xs text-danger">{errors.code}</p>}
      </div>
      <div>
        <label className="label" htmlFor="fp-password">{t.newPassword}</label>
        <div className="relative">
          <input id="fp-password" type={show ? "text" : "password"} required minLength={10} autoComplete="new-password" dir="ltr" className="field pe-11" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute end-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-faint hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? <p className="mt-1.5 text-xs text-danger">{errors.password}</p> : <p className="mt-1.5 text-xs text-faint">{t.passwordHint}</p>}
      </div>
      <ActionNotice state={state} />
      <button className="btn btn-primary btn-lg w-full" disabled={state.kind === "pending" || code.length !== 6 || password.length < 10}>
        {state.kind === "pending" ? dict.common.loading : t.resetCta}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <button type="button" className="font-medium text-accent hover:underline disabled:opacity-50" disabled={cooldown.left > 0} onClick={sendCode}>
          {cooldown.left > 0 ? fill(t.resendIn, { s: cooldown.left }) : t.resend}
        </button>
        <button type="button" className="text-muted hover:text-ink" onClick={() => { setStep("email"); setCode(""); setInfo(null); setState({ kind: "idle" }); }}>
          {t.changeEmail}
        </button>
      </div>
    </form>
  );
}

// ───────────────────────── Google ─────────────────────────

/** "Continue with Google" — shown only when the server has Google configured. A plain link, not api(). */
export function GoogleButton({ next }: { next?: string | null }) {
  const { dict, locale } = useI18n();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let alive = true;
    api("GET /api/auth/providers").then((r) => alive && r.ok && setEnabled(r.data.google));
    return () => {
      alive = false;
    };
  }, []);
  if (!enabled) return null;
  const target = next ?? href(locale, "/dashboard");
  return (
    <div className="mb-5 space-y-5">
      <a href={`/api/auth/google?next=${encodeURIComponent(target)}&lang=${locale}`} className="btn btn-outline btn-lg w-full">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7Z" />
          <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
        </svg>
        {dict.auth.google}
      </a>
      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-faint">
        <span className="h-px flex-1 bg-line" /> {dict.auth.or} <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}

const GOOGLE_ERRORS: GoogleAuthError[] = ["google_unavailable", "google_cancelled", "google_failed", "google_unverified_email", "suspended"];

export function AuthError({ code }: { code?: string }) {
  const { dict } = useI18n();
  if (!code || !GOOGLE_ERRORS.includes(code as GoogleAuthError)) return null;
  return <p role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{dict.auth.errors[code as GoogleAuthError]}</p>;
}
