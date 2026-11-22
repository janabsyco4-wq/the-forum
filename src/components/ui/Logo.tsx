import Link from "next/link";
import type { Locale } from "@/types/domain";
import { href } from "@/i18n/config";

/** The mark: a speech-arch on the brand spectrum. */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="forum-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2a7a" />
          <stop offset="0.5" stopColor="#4b3aa6" />
          <stop offset="1" stopColor="#8e3f8a" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#forum-mark)" />
      <path d="M9 24V14.5C9 10.4 12.1 7 16 7s7 3.4 7 7.5V24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M13 24v-7.5a3 3 0 0 1 6 0V24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function Logo({ locale, name }: { locale: Locale; name: string }) {
  return (
    <Link href={href(locale)} className="group inline-flex items-center gap-2.5" aria-label={name}>
      <LogoMark />
      <span className="whitespace-nowrap font-display text-[1.2rem] font-semibold tracking-[0.02em] text-ink">
        {locale === "ur" ? (
          <span className="text-gradient">{name}</span>
        ) : (
          <>
            THE <span className="text-gradient">FORUM</span>
          </>
        )}
      </span>
    </Link>
  );
}
