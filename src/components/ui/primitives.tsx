import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Tone } from "@/lib/ui/tones";

export function SectionHeading({
  eyebrow,
  title,
  body,
  action,
  tone,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: { label: string; href: string };
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={`mb-7 flex flex-col gap-4 md:mb-9 md:flex-row md:items-end md:justify-between ${tone ? `tone-${tone}` : ""} ${className}`}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="eyebrow mb-3 inline-flex items-center gap-2">
            <span className={`h-1.5 w-5 rounded-full ${tone ? "t-dot" : "bg-brand"}`} /> {eyebrow}
          </p>
        )}
        <h2 className="font-display text-[1.85rem] leading-tight text-ink md:text-[2.4rem] text-balance">{title}</h2>
        {body && <p className="mt-2.5 text-[0.98rem] leading-relaxed text-muted md:text-[1.02rem]">{body}</p>}
      </div>
      {action && (
        <Link href={action.href} className={`group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold ${tone ? "t-text" : "text-accent-ink"} hover:opacity-80`}>
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, body, tone = "indigo", children }: { eyebrow?: string; title: string; body?: string; tone?: Tone; children?: React.ReactNode }) {
  return (
    <header className={`tone-${tone} relative overflow-hidden border-b border-line`}>
      <div className="pointer-events-none absolute inset-0 mesh opacity-90" />
      <div className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full blur-3xl t-soft opacity-80" />
      <div className="container-page relative py-12 md:py-20">
        <div className="max-w-3xl animate-fade-up">
          {eyebrow && (
            <p className="eyebrow mb-4 inline-flex items-center gap-2">
              <span className="h-1.5 w-5 rounded-full t-dot" /> {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[2.4rem] leading-[1.08] text-ink sm:text-5xl md:text-6xl text-balance">{title}</h1>
          {body && <p className="mt-4 text-base leading-relaxed text-muted md:mt-5 md:text-lg text-pretty">{body}</p>}
        </div>
        {children && <div className="mt-7 md:mt-8">{children}</div>}
      </div>
    </header>
  );
}

const statusTones = {
  neutral: "bg-surface-2 text-ink-2",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  dark: "bg-ink text-bg",
  brand: "bg-brand text-white",
};

/** `tone` is either a status (success, warning…) or any spectrum colour (indigo, rose, teal…). */
export function Badge({ tone = "neutral", children, className = "" }: { tone?: keyof typeof statusTones | Tone; children: React.ReactNode; className?: string }) {
  const cls = tone in statusTones ? statusTones[tone as keyof typeof statusTones] : `tone-${tone} t-pill`;
  return <span className={`badge ${cls} ${className}`}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 h-1.5 w-12 rounded-full bg-brand" />
      <p className="font-display text-xl text-ink">{title}</p>
      {body && <p className="mt-2 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Horizontal, swipeable chip row on phones; wraps on larger screens. */
export function ChipRow({ children, label, className = "" }: { children: React.ReactNode; label?: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={`scroll-row sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 ${className}`}>
      {children}
    </div>
  );
}
