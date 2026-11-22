import type { AdminStats, Locale } from "@/types/domain";
import { formatDate } from "@/i18n";

/** Lightweight SVG line chart — no chart library needed. Always drawn left-to-right (time axis). */
export function WeeklyChart({ weekly, labels, locale }: { weekly: AdminStats["weekly"]; labels: { signups: string; articles: string; arguments: string }; locale: Locale }) {
  const W = 720, H = 240, P = { t: 16, r: 16, b: 28, l: 40 };
  const series = [
    { key: "arguments" as const, color: "var(--c-rose)", label: labels.arguments },
    { key: "signups" as const, color: "var(--c-indigo)", label: labels.signups },
    { key: "articles" as const, color: "var(--c-emerald)", label: labels.articles },
  ];
  const max = Math.ceil(Math.max(...weekly.flatMap((w) => [w.signups, w.articles, w.arguments])) / 50) * 50;
  const x = (i: number) => P.l + (i / (weekly.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const path = (k: "signups" | "articles" | "arguments") => weekly.map((w, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(w[k]).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <div dir="ltr">
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Weekly activity, last 12 weeks">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--faint)">{t}</text>
          </g>
        ))}
        {weekly.map((w, i) =>
          i % 2 === 0 ? (
            <text key={w.weekStart} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--faint)">
              {formatDate(w.weekStart, locale, { day: "numeric", month: "short" })}
            </text>
          ) : null,
        )}
        <path d={`${path("signups")} L${x(weekly.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="var(--c-indigo)" opacity="0.1" />
        {series.map((s) => (
          <path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map((s) => (
          <circle key={s.key} cx={x(weekly.length - 1)} cy={y(weekly[weekly.length - 1][s.key])} r="4" fill="var(--surface)" stroke={s.color} strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
}
