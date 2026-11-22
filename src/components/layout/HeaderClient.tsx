"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, ChevronDown, ChevronRight, FlaskConical, Gavel, Home, Languages, LayoutDashboard, LogOut, MessagesSquare, Moon, PenLine, Search, Settings, ShieldCheck, Sparkles, Sun, UserRound, X } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { href } from "@/i18n/config";
import type { Tone } from "@/lib/ui/tones";
import type { PrivateUser } from "@/types/domain";
import { api } from "@/lib/api/client";
import { LogoMark } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";

export type HeaderUser = Pick<PrivateUser, "id" | "name" | "username" | "email" | "role" | "avatarUrl">;
const isStaff = (u: HeaderUser | null) => !!u && (u.role === "admin" || u.role === "moderator");

/** Account links shared by the desktop dropdown and the mobile drawer. */
function useAccountLinks(user: HeaderUser | null) {
  const { dict } = useI18n();
  if (!user) return [];
  return [
    { key: "dashboard", label: dict.nav.dashboard, path: "/dashboard", icon: LayoutDashboard, tone: "indigo" as Tone },
    ...(isStaff(user) ? [{ key: "admin", label: dict.nav.admin, path: "/admin", icon: ShieldCheck, tone: "rose" as Tone }] : []),
    { key: "profile", label: dict.nav.profile, path: `/u/${user.username}`, icon: UserRound, tone: "violet" as Tone },
    { key: "settings", label: dict.nav.settings, path: "/settings/profile", icon: Settings, tone: "slate" as Tone },
  ];
}

function useSignOut() {
  const router = useRouter();
  const { locale } = useI18n();
  const [busy, setBusy] = useState(false);
  return {
    busy,
    signOut: async () => {
      setBusy(true);
      await api("POST /api/auth/logout");
      router.push(href(locale));
      router.refresh();
      setBusy(false);
    },
  };
}

// ───────────────────────── Account menu (desktop) ─────────────────────────

export function UserMenu({ user }: { user: HeaderUser }) {
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = useAccountLinks(user);
  const { signOut, busy } = useSignOut();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target as HTMLElement).closest("[data-user-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <div className="relative ms-1 hidden lg:block" data-user-menu>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={dict.nav.account}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full p-1 pe-2 transition-colors hover:bg-surface-2"
      >
        <Avatar user={user} size="sm" />
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-12 z-[60] w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-float animate-fade-up">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <Avatar user={user} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted" dir="ltr">{user.email}</p>
            </div>
          </div>
          <div className="p-1.5">
            {links.map((l) => (
              <Link key={l.key} role="menuitem" href={href(locale, l.path)} className={`tone-${l.tone} flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-2 hover-tone hover:text-ink`}>
                <l.icon className="h-4 w-4 t-text" /> {l.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-line p-1.5">
            <button type="button" role="menuitem" disabled={busy} onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft">
              <LogOut className="h-4 w-4 rtl:-scale-x-100" /> {dict.nav.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export type NavKey = "home" | "articles" | "debates" | "discussions" | "community" | "research" | "write";
export type NavItem = { key: NavKey; label: string; path: string; tone: Tone };

const icons = { home: Home, articles: BookOpen, debates: Gavel, discussions: MessagesSquare, community: Sparkles, research: FlaskConical, write: PenLine };

/** Round icon button used across the header. */
const ICON_BTN = "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink";

function useIsActive() {
  const pathname = usePathname();
  return (path: string) => {
    const rest = pathname.replace(/^\/(en|ur)/, "") || "/";
    return path === "/" ? rest === "/" : rest === path || rest.startsWith(path + "/");
  };
}

/** Render overlays at <body> level so the header's backdrop-filter can't trap `position: fixed`. */
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

function useLockScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  useEffect(() => {
    let current: "light" | "dark" = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    // One-time migration: earlier versions kept the choice in localStorage.
    try {
      const legacy = localStorage.getItem("forum_theme");
      if (legacy === "dark" || legacy === "light") {
        current = legacy;
        document.documentElement.dataset.theme = legacy;
        document.cookie = `forum_theme=${legacy}; path=/; max-age=31536000; samesite=lax`;
        localStorage.removeItem("forum_theme");
      }
    } catch {}
    setThemeState(current);
  }, []);
  const setTheme = (t: "light" | "dark") => {
    document.documentElement.dataset.theme = t;
    document.cookie = `forum_theme=${t}; path=/; max-age=31536000; samesite=lax`;
    setThemeState(t);
  };
  return [theme, setTheme] as const;
}

function useLocaleHref() {
  const pathname = usePathname();
  return (target: "en" | "ur") => pathname.replace(/^\/(en|ur)(?=\/|$)/, `/${target}`);
}
const rememberLocale = (l: string) => {
  document.cookie = `forum_locale=${l}; path=/; max-age=31536000; samesite=lax`;
};

// ───────────────────────── Desktop nav ─────────────────────────

export function NavLinks({ items }: { items: NavItem[] }) {
  const { locale } = useI18n();
  const isActive = useIsActive();
  return (
    <nav aria-label="Primary" className="hidden items-center gap-0.5 rounded-full bg-surface-2/80 p-1 ring-1 ring-line/60 lg:flex">
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.key}
            href={href(locale, item.path)}
            aria-current={active ? "page" : undefined}
            className={`tone-${item.tone} group inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.85rem] font-medium transition-all xl:px-3.5 ${active ? "bg-surface t-text shadow-soft ring-1 ring-line" : "text-muted hover:text-ink"}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full t-dot transition-transform ${active ? "scale-125" : "opacity-70 group-hover:opacity-100"}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const to = useLocaleHref();
  const target = locale === "en" ? "ur" : "en";
  return (
    <Link
      href={to(target)}
      hrefLang={target}
      onClick={() => rememberLocale(target)}
      className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      aria-label={`${dict.nav.language}: ${target === "ur" ? "اردو" : "English"}`}
    >
      <Languages className="h-4 w-4 text-violet" />
      <span lang={target} className="hidden xl:inline">
        {target === "ur" ? "اردو" : "English"}
      </span>
    </Link>
  );
}

export function ThemeToggle() {
  const { dict } = useI18n();
  const [theme, setTheme] = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button type="button" className={ICON_BTN} aria-label={`${dict.nav.theme}: ${next === "dark" ? dict.nav.dark : dict.nav.light}`} onClick={() => setTheme(next)}>
      {theme === "dark" ? <Sun className="h-[1.1rem] w-[1.1rem] text-amber" /> : <Moon className="h-[1.1rem] w-[1.1rem] text-indigo" />}
    </button>
  );
}

// ───────────────────────── Search ─────────────────────────

export function SearchButton() {
  const { locale, dict } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  useLockScroll(open);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <button type="button" className={ICON_BTN} aria-label={dict.nav.search} onClick={() => setOpen(true)}>
        <Search className="h-[1.1rem] w-[1.1rem]" />
      </button>
      {open && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-start justify-center bg-[#0a0f1d]/50 px-3 pt-[12vh] backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)}>
            <form
              role="search"
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-float animate-fade-up"
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
                router.push(`${href(locale, "/articles")}?q=${encodeURIComponent(q)}`);
              }}
            >
              <div className="brand-line" />
              <label className="flex items-center gap-3 px-4 sm:px-5">
                <Search className="h-5 w-5 shrink-0 text-accent" />
                <span className="sr-only">{dict.nav.search}</span>
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={dict.nav.searchPlaceholder}
                  className="h-14 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-faint sm:h-16 sm:text-lg"
                />
                <button type="button" onClick={() => setOpen(false)} className={ICON_BTN} aria-label={dict.nav.close}>
                  <X className="h-4 w-4" />
                </button>
              </label>
            </form>
          </div>
        </Portal>
      )}
    </>
  );
}

// ───────────────────────── Mobile drawer ─────────────────────────

export function MobileMenu({ items, user }: { items: NavItem[]; user: HeaderUser | null }) {
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = useIsActive();
  const [theme, setTheme] = useTheme();
  const to = useLocaleHref();
  const accountLinks = useAccountLinks(user);
  const { signOut, busy } = useSignOut();
  useLockScroll(open);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={dict.nav.menu}
        onClick={() => setOpen(true)}
        className="group ms-1 inline-flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full bg-surface-2 transition-colors hover:bg-line"
      >
        <span className="h-[1.5px] w-[17px] rounded-full bg-ink" />
        <span className="h-[1.5px] w-[17px] rounded-full bg-brand" />
        <span className="h-[1.5px] w-[10px] self-end me-[11px] rounded-full bg-ink transition-all group-hover:w-[17px]" />
      </button>

      {open && (
        <Portal>
          <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label={dict.nav.menu}>
            <button type="button" aria-label={dict.nav.close} onClick={() => setOpen(false)} className="absolute inset-0 bg-[#0a0f1d]/55 backdrop-blur-sm animate-fade-in" />
            <aside className="absolute inset-y-0 end-0 flex w-[88%] max-w-sm flex-col overflow-y-auto overflow-x-hidden overscroll-contain bg-bg shadow-float animate-drawer">
              <div className="h-[2px] shrink-0 bg-spectrum" />
              {/* Header */}
              <div className="flex h-16 shrink-0 items-center justify-between px-5">
                <span className="inline-flex items-center gap-2.5">
                  <LogoMark className="h-8 w-8" />
                  <span className="font-display text-lg font-semibold text-gradient">{dict.brand.name}</span>
                </span>
                <button type="button" onClick={() => setOpen(false)} className={`${ICON_BTN} border border-line bg-surface`} aria-label={dict.nav.close}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Signed in: account card. Signed out: join card. */}
              {user ? (
                <div className="px-5">
                  <div className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-xs text-muted" dir="ltr">@{user.username}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-1.5 [&>*:last-child:nth-child(odd)]:col-span-2">
                      {accountLinks.map((l) => (
                        <Link key={l.key} href={href(locale, l.path)} className={`tone-${l.tone} inline-flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-[0.82rem] font-semibold t-softer hover:opacity-90 ${isActive(l.path) ? "ring-1 ring-[var(--tone-line)]" : ""}`}>
                          <l.icon className="h-4 w-4 shrink-0 t-text" />
                          <span className="truncate text-ink">{l.label}</span>
                        </Link>
                      ))}
                    </div>
                    <button type="button" disabled={busy} onClick={signOut} className="mt-1.5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-2.5 py-2 text-[0.82rem] font-semibold text-danger hover:bg-danger-soft">
                      <LogOut className="h-4 w-4 rtl:-scale-x-100" /> {dict.nav.signOut}
                    </button>
                  </div>
                </div>
              ) : (
              <div className="px-5">
                <div className="relative overflow-hidden rounded-2xl bg-night p-5 text-white">
                  <div className="pointer-events-none absolute -end-12 -top-12 h-36 w-36 rounded-full bg-brand opacity-50 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-14 -start-10 h-32 w-32 rounded-full bg-[#4a4fc9] opacity-30 blur-3xl" />
                  <p className="relative font-display text-xl leading-snug">{dict.brand.tagline}</p>
                  <p className="relative mt-1 text-sm text-white/80">{dict.auth.registerBody}</p>
                  <div className="relative mt-4 grid grid-cols-2 gap-2">
                    <Link href={href(locale, "/register")} className="btn btn-sm h-10 bg-white text-[#1c1b45] hover:bg-white/90">
                      {dict.auth.createAccount}
                    </Link>
                    <Link href={href(locale, "/login")} className="btn btn-sm h-10 border border-white/50 text-white hover:bg-white/10">
                      {dict.nav.signIn}
                    </Link>
                  </div>
                </div>
              </div>
              )}

              {/* Navigation */}
              <nav className="mt-5 px-3" aria-label={dict.nav.menu}>
                <ul className="space-y-1">
                  {[...items, { key: "write" as const, label: dict.nav.write, path: "/write", tone: "coral" as const }].map((item) => {
                    const Icon = icons[item.key];
                    const active = isActive(item.path);
                    return (
                      <li key={item.key}>
                        <Link
                          href={href(locale, item.path)}
                          aria-current={active ? "page" : undefined}
                          className={`tone-${item.tone} flex items-center gap-3.5 rounded-2xl px-2.5 py-2 transition-colors ${active ? "t-softer ring-1 ring-[var(--tone-line)]" : "hover-tone"}`}
                        >
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl t-pill">
                            <Icon className="h-[1.15rem] w-[1.15rem]" />
                          </span>
                          <span className={`flex-1 text-[1.02rem] font-semibold ${active ? "t-text" : "text-ink"}`}>{item.label}</span>
                          <ChevronRight className={`h-4 w-4 rtl:-scale-x-100 ${active ? "t-text" : "text-faint"}`} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Preferences */}
              <div className="mt-4 space-y-3 border-t border-line px-5 pb-8 pt-5">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">{dict.nav.language}</p>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
                    {(["en", "ur"] as const).map((l) => (
                      <Link
                        key={l}
                        href={to(l)}
                        hrefLang={l}
                        lang={l}
                        onClick={() => rememberLocale(l)}
                        className={`inline-flex h-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${locale === l ? "bg-surface text-ink shadow-soft" : "text-muted"}`}
                      >
                        {l === "en" ? "English" : "اردو"}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">{dict.nav.theme}</p>
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
                    {(["light", "dark"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={theme === t}
                        onClick={() => setTheme(t)}
                        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors ${theme === t ? "bg-surface text-ink shadow-soft" : "text-muted"}`}
                      >
                        {t === "light" ? <Sun className="h-4 w-4 text-amber" /> : <Moon className="h-4 w-4 text-indigo" />}
                        {t === "light" ? dict.nav.light : dict.nav.dark}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Portal>
      )}
    </div>
  );
}

// ───────────────────────── Bottom nav (phones) ─────────────────────────

export function BottomNav({ items }: { items: NavItem[] }) {
  const { locale } = useI18n();
  const isActive = useIsActive();
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/90 pb-safe backdrop-blur-xl lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const Icon = icons[item.key];
          const active = isActive(item.path);
          if (item.key === "write")
            return (
              <li key={item.key} className="flex justify-center">
                <Link href={href(locale, item.path)} aria-label={item.label} className="btn-brand -mt-4 inline-flex h-12 w-12 items-center justify-center rounded-full text-white ring-4 ring-bg">
                  <Icon className="h-5 w-5" />
                </Link>
              </li>
            );
          return (
            <li key={item.key} className={`tone-${item.tone}`}>
              <Link
                href={href(locale, item.path)}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[0.66rem] font-semibold ${active ? "t-text" : "text-muted"}`}
              >
                <span className={`inline-flex h-7 w-11 items-center justify-center rounded-full transition-colors ${active ? "t-soft" : ""}`}>
                  <Icon className="h-[1.15rem] w-[1.15rem]" />
                </span>
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
