import { randomBytes } from "node:crypto";

/**
 * URL slug from a title. Keeps ASCII letters/digits; Urdu-only titles fall
 * back to `fallback`. A short random suffix makes it unique without a lookup
 * loop (the unique index is the real guarantee).
 */
export function makeSlug(title: string, fallback = "post"): string {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  const suffix = randomBytes(4).toString("hex").slice(0, 6);
  return `${base || fallback}-${suffix}`;
}

/** ~200 wpm for English; Urdu text is counted the same way (space-separated words). */
export function readingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function makeExcerpt(text: string, max = 220): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
