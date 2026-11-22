import type { ArticleType, DiscussionTopic, InitiativeKind, ResearchType } from "@/types/domain";

/** The spectrum. Each name maps to a `.tone-<name>` class in globals.css. */
export type Tone = "indigo" | "violet" | "fuchsia" | "rose" | "coral" | "amber" | "lime" | "emerald" | "teal" | "cyan" | "sky" | "slate";

const categoryTones: Record<string, Tone> = {
  politics: "indigo",
  economy: "emerald",
  education: "sky",
  history: "amber",
  society: "rose",
  philosophy: "violet",
  technology: "cyan",
  climate: "teal",
  culture: "fuchsia",
  law: "slate",
};

const topicTones: Record<DiscussionTopic, Tone> = {
  "current-affairs": "coral",
  society: "rose",
  politics: "indigo",
  education: "sky",
  history: "amber",
  economy: "emerald",
  science: "cyan",
  culture: "fuchsia",
  philosophy: "violet",
  other: "slate",
};

const typeTones: Record<ArticleType, Tone> = { article: "indigo", essay: "violet", blog: "amber", opinion: "rose", research: "teal" };
const researchTones: Record<ResearchType, Tone> = { paper: "indigo", "policy-brief": "emerald", dataset: "cyan", review: "violet", "challenge-entry": "amber" };

const fallback: Tone[] = ["indigo", "violet", "rose", "coral", "amber", "emerald", "teal", "sky", "fuchsia", "cyan"];

export function hashTone(seed: string): Tone {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return fallback[h % fallback.length];
}

export const categoryTone = (slug: string): Tone => categoryTones[slug] ?? hashTone(slug);
export const topicTone = (t: DiscussionTopic): Tone => topicTones[t];
export const typeTone = (t: ArticleType): Tone => typeTones[t];
export const researchTone = (t: ResearchType): Tone => researchTones[t];
export const initiativeTone = (k: InitiativeKind): Tone => (k === "research-challenge" ? "cyan" : "emerald");

/** Rotating tones for lists of equal items (pillars, stats, steps…). */
export const sequence: Tone[] = ["indigo", "rose", "amber", "emerald", "violet", "sky", "coral", "teal"];
export const nth = (i: number): Tone => sequence[i % sequence.length];
