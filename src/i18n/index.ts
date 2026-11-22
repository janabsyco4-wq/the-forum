import type { Locale, LocalizedText } from "@/types/domain";
import en, { type Dictionary } from "./dictionaries/en";
import ur from "./dictionaries/ur";

const dictionaries: Record<Locale, Dictionary> = { en, ur };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };

/** Pick the right language from a LocalizedText, falling back to English. */
export function lt(text: LocalizedText, locale: Locale) {
  return (locale === "ur" && text.ur) || text.en;
}

const urDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Locale-aware number: 12400 → "12.4k" / "۱۲٫۴ ہزار". */
export function formatNumber(n: number, locale: Locale, compact = true) {
  const s = new Intl.NumberFormat(locale === "ur" ? "ur-PK" : "en-PK", compact ? { notation: "compact", maximumFractionDigits: 1 } : undefined).format(n);
  return locale === "ur" ? toUrduDigits(s) : s;
}

export function toUrduDigits(s: string) {
  return s.replace(/[0-9]/g, (d) => urDigits[Number(d)]);
}

export function formatDate(iso: string, locale: Locale, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const s = new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-GB", { ...opts, timeZone: "Asia/Karachi" }).format(new Date(iso));
  return locale === "ur" ? toUrduDigits(s) : s;
}

/** "3 days ago" in either language, relative to `now`. */
export function timeAgo(iso: string, locale: Locale, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale === "ur" ? "ur" : "en", { numeric: "auto" });
  const abs = Math.abs(diff);
  const pick: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ];
  let unit: Intl.RelativeTimeFormatUnit = "year";
  let value = diff / 31557600;
  for (let i = 0; i < pick.length; i++) {
    if (abs < pick[i][0]) {
      unit = pick[i][1];
      value = i === 0 ? diff : diff / pick[i - 1][0];
      break;
    }
  }
  const s = rtf.format(Math.round(value), unit);
  return locale === "ur" ? toUrduDigits(s) : s;
}
