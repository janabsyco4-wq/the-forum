"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/types/domain";

const Ctx = createContext<{ locale: Locale; dict: Dictionary } | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, dict }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside <I18nProvider>");
  return v;
}
