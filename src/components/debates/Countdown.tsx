"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { toUrduDigits } from "@/i18n";

function parts(target: number) {
  const ms = Math.max(0, target - Date.now());
  return { d: Math.floor(ms / 86_400_000), h: Math.floor((ms / 3_600_000) % 24), m: Math.floor((ms / 60_000) % 60), done: ms === 0 };
}

export function Countdown({ to, tone = "light" }: { to: string; tone?: "light" | "dark" }) {
  const { dict, locale } = useI18n();
  const target = new Date(to).getTime();
  const [p, setP] = useState(() => parts(target));
  useEffect(() => {
    const id = setInterval(() => setP(parts(target)), 30_000);
    return () => clearInterval(id);
  }, [target]);
  const n = (x: number) => (locale === "ur" ? toUrduDigits(String(x).padStart(2, "0")) : String(x).padStart(2, "0"));
  const box = tone === "dark" ? "bg-white/8 border-white/12 text-white" : "bg-surface border-line text-ink";
  const lbl = tone === "dark" ? "text-white/60" : "text-muted";
  const accents = ["#9aa1f0", "#b3a0ec", "#d79ccb"];
  return (
    <div className="flex gap-2" role="timer" aria-label={`${p.d} ${dict.common.days}, ${p.h} ${dict.common.hours}, ${p.m} ${dict.common.minutes}`}>
      {[
        [p.d, dict.common.days],
        [p.h, dict.common.hours],
        [p.m, dict.common.minutes],
      ].map(([v, l], i) => (
        <div key={l as string} className={`relative min-w-[4rem] flex-1 overflow-hidden rounded-xl border px-2.5 py-2 text-center sm:min-w-[4.25rem] sm:flex-none sm:px-3 ${box}`}>
          <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accents[i] }} />
          <p className="font-display text-2xl tabular-nums" suppressHydrationWarning>
            {n(v as number)}
          </p>
          <p className={`text-[0.68rem] uppercase tracking-wider ${lbl}`}>{l}</p>
        </div>
      ))}
    </div>
  );
}
