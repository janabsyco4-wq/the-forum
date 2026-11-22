/**
 * zod schemas for every write endpoint in src/lib/api/contract.ts.
 * `satisfies`-style checks at the bottom keep them aligned with the contract.
 */
import { z } from "zod";
import type {
  ArgumentInput,
  ArticleInput,
  CommentInput,
  DebateInput,
  DiscussionInput,
  LoginInput,
  RegisterInput,
  ReportInput,
} from "@/lib/api/contract";

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optText = (max: number) => z.string().trim().max(max).optional();

export const locale = z.enum(["en", "ur"]);
export const slugLike = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
  .max(60);

/** http(s) URL, or one of our own uploads (/api/uploads/...). */
export const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v.startsWith("/api/uploads/") || /^https:\/\/[^\s]+$/i.test(v), "Must be an https URL or an uploaded image");

const webUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https?:\/\/[^\s]+$/i.test(v), "Must start with http:// or https://");

/** Reading-list links: absolute http(s) URLs or site-relative paths like /en/articles/x. */
const linkUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^https?:\/\/[^\s]+$/i.test(v) || /^\/(?!\/)[^\s]*$/.test(v), "Must be an http(s) URL or a site path");

const isoDate = z.iso.datetime({ offset: true }).or(z.iso.date());

// ── Auth ──
export const registerSchema = z.object({
  name: trimmed(2, 80),
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/, "Letters, numbers, - and _ only (start and end with a letter or number)"),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email")),
  password: z.string().min(10, "At least 10 characters").max(200),
  university: optText(120),
  preferredLocale: locale.default("en"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email")),
  password: z.string().min(1).max(200),
});

const emailField = z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email"));
const codeField = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");
export const newsletterSchema = z.object({ email: emailField, locale: locale.optional() });
export const verifyEmailSchema =z.object({ code: codeField }).strict();
export const forgotPasswordSchema = z.object({ email: emailField }).strict();
export const resetPasswordSchema = z
  .object({ email: emailField, code: codeField, password: z.string().min(10, "At least 10 characters").max(200) })
  .strict();

// ── Users ──
export const profileSchema = z
  .object({
    name: trimmed(2, 80),
    headline: optText(120),
    bio: optText(1000),
    university: optText(120),
    city: optText(80),
    country: optText(80),
    website: webUrl.or(z.literal("")).optional(),
    avatarUrl: imageUrl.or(z.literal("")).optional(),
    interests: z.array(slugLike).max(20),
  })
  .partial()
  .strict();

// ── Articles ──
export const articleType = z.enum(["article", "essay", "blog", "opinion", "research"]);
export const articleSchema = z.object({
  title: trimmed(3, 200),
  subtitle: optText(300),
  excerpt: optText(400),
  body: z.string().max(200_000),
  type: articleType,
  category: slugLike,
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(10).default([]),
  language: locale,
  coverImage: imageUrl.optional(),
  coverAlt: optText(200),
});
export const articlePatchSchema = articleSchema.partial().strict();

// ── Debates ──
const debateSide = z.enum(["for", "against", "neutral"]);
export const debateSchema = z.object({
  title: trimmed(5, 200),
  question: trimmed(5, 400),
  context: z.string().max(50_000),
  category: slugLike,
  language: locale,
  opensAt: isoDate,
  closesAt: isoDate,
  sides: z.object({ for: trimmed(1, 80), against: trimmed(1, 80) }),
  readings: z.array(z.object({ title: trimmed(1, 200), url: linkUrl })).max(20).default([]),
  coverImage: imageUrl.optional(),
});
export const debatePatchSchema = debateSchema.partial().strict();

export const argumentSchema = z.object({
  kind: z.enum(["argument", "counterargument", "reply", "solution"]),
  side: debateSide,
  parentId: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id").optional(),
  title: optText(200),
  body: trimmed(20, 8000),
});

export const conclusionSchema = z.object({
  summary: trimmed(10, 600),
  body: z.string().min(1).max(50_000),
  verdict: debateSide.optional(),
});

export const voteSchema = z.object({ value: z.union([z.literal(1), z.literal(-1)]) });

// ── Discussions & comments ──
export const discussionTopic = z.enum([
  "current-affairs",
  "society",
  "politics",
  "education",
  "history",
  "economy",
  "science",
  "culture",
  "philosophy",
  "other",
]);
export const discussionSchema = z.object({
  title: trimmed(5, 200),
  body: trimmed(10, 10_000),
  topic: discussionTopic,
  language: locale,
});

export const commentSchema = z.object({
  targetType: z.enum(["article", "discussion"]),
  targetId: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id"),
  parentId: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id").optional(),
  body: trimmed(1, 5000),
});

// ── Moderation ──
export const reportSchema = z.object({
  targetType: z.enum(["article", "comment", "discussion", "argument", "user"]),
  targetId: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id"),
  reason: z.enum(["spam", "harassment", "hate-speech", "misinformation", "plagiarism", "off-topic", "other"]),
  details: optText(1000),
});

export const adminUserSchema = z
  .object({
    role: z.enum(["member", "writer", "ambassador", "moderator", "admin"]).optional(),
    status: z.enum(["active", "suspended", "pending"]).optional(),
  })
  .strict()
  .refine((v) => v.role !== undefined || v.status !== undefined, "Nothing to update");

export const adminArticleSchema = z
  .object({
    status: z.enum(["draft", "pending", "published", "rejected", "archived"]).optional(),
    featured: z.boolean().optional(),
    editorsPick: z.boolean().optional(),
    moderationNote: optText(1000),
  })
  .strict();

export const adminReportSchema = z
  .object({
    status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
    resolution: optText(1000),
  })
  .strict();

export const adminContentSchema = z.object({ status: z.enum(["visible", "hidden", "removed"]) }).strict();

// ── Compile-time alignment with the shared contract ──
type Assert<T extends true> = T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type KeysOf<T> = keyof T;
export type _Checks = [
  Assert<Same<KeysOf<z.input<typeof registerSchema>>, KeysOf<RegisterInput>>>,
  Assert<Same<KeysOf<z.input<typeof loginSchema>>, KeysOf<LoginInput>>>,
  Assert<Same<KeysOf<z.input<typeof articleSchema>>, KeysOf<ArticleInput>>>,
  Assert<Same<KeysOf<z.input<typeof debateSchema>>, KeysOf<DebateInput>>>,
  Assert<Same<KeysOf<z.input<typeof argumentSchema>>, KeysOf<ArgumentInput>>>,
  Assert<Same<KeysOf<z.input<typeof discussionSchema>>, KeysOf<DiscussionInput>>>,
  Assert<Same<KeysOf<z.input<typeof commentSchema>>, KeysOf<CommentInput>>>,
  Assert<Same<KeysOf<z.input<typeof reportSchema>>, KeysOf<ReportInput>>>,
];
