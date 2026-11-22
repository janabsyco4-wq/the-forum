import { notFound } from "next/navigation";
import type { Locale } from "@/types/domain";
import { hasLocale } from "./config";
import { getDictionary } from "./index";

/** Resolve the `[lang]` route param for a page or layout; 404s on unknown locales. */
export async function resolveLocale(params: Promise<{ lang: string }>): Promise<{ locale: Locale; dict: ReturnType<typeof getDictionary> }> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return { locale: lang, dict: getDictionary(lang) };
}
