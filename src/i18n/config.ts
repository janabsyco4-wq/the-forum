import type { Locale } from "@/types/domain";

export const locales = ["en", "ur"] as const satisfies readonly Locale[];
export const defaultLocale: Locale = "en";

export const localeMeta: Record<Locale, { label: string; native: string; dir: "ltr" | "rtl"; htmlLang: string; ogLocale: string }> = {
  en: { label: "English", native: "English", dir: "ltr", htmlLang: "en", ogLocale: "en_PK" },
  ur: { label: "Urdu", native: "اردو", dir: "rtl", htmlLang: "ur", ogLocale: "ur_PK" },
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale) {
  return localeMeta[locale].dir;
}

/** Prefix an internal path with the locale: href("ur", "/articles") → "/ur/articles". */
export function href(locale: Locale, path = "/") {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
