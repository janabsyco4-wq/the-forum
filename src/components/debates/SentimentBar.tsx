import type { Locale } from "@/types/domain";
import { toUrduDigits } from "@/i18n";

export function SentimentBar({
  votesFor,
  votesAgainst,
  forLabel,
  againstLabel,
  locale,
  tone = "light",
}: {
  votesFor: number;
  votesAgainst: number;
  forLabel: string;
  againstLabel: string;
  locale: Locale;
  tone?: "light" | "dark";
}) {
  const total = votesFor + votesAgainst || 1;
  const pf = Math.round((votesFor / total) * 100);
  const pct = (n: number) => (locale === "ur" ? toUrduDigits(String(n)) : String(n)) + "%";
  const muted = tone === "dark" ? "text-white/70" : "text-muted";
  return (
    <div>
      <div className={`mb-2 flex justify-between gap-3 text-sm ${muted}`}>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-for" />
          <span className={`font-bold ${tone === "dark" ? "text-[#7cc5c2]" : "text-for"}`}>{pct(pf)}</span>
          <span className="truncate">{forLabel}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <span className="truncate">{againstLabel}</span>
          <span className={`font-bold ${tone === "dark" ? "text-[#e597a8]" : "text-against"}`}>{pct(100 - pf)}</span>
          <span className="h-2 w-2 shrink-0 rounded-full bg-against" />
        </span>
      </div>
      <div className={`flex h-2.5 gap-1 overflow-hidden rounded-full ${tone === "dark" ? "bg-white/10" : "bg-surface-2"}`} role="img" aria-label={`${forLabel} ${pf}%, ${againstLabel} ${100 - pf}%`}>
        <div className="h-full rounded-full bg-gradient-to-r from-[#2d7a79] to-[#4fa3a0] rtl:bg-gradient-to-l" style={{ width: `${pf}%` }} />
        <div className="h-full flex-1 rounded-full bg-gradient-to-r from-[#c9677d] to-[#b8445f] rtl:bg-gradient-to-l" />
      </div>
    </div>
  );
}
