/**
 * Index definitions. `ensureIndexes` is idempotent (createIndex is a no-op when
 * an identical index exists) and runs once per process from getDb(), and from
 * `npm run db:indexes` / the seed script.
 */
import type { Collection, CreateIndexesOptions, Db, Document, IndexSpecification } from "mongodb";
import { collections } from "./collections";

/**
 * Options shared by every text index. Our documents have a `language` field
 * ("en" | "ur"), which MongoDB would otherwise read as each document's text-search
 * language, and "ur" is not a supported one ("language override unsupported: ur").
 * Pointing `language_override` at a field we never write turns that off.
 * `default_language: "none"` turns off English-only stemming and stop words for
 * mixed English and Urdu content.
 */
const TEXT_OPTS = { default_language: "none", language_override: "textLanguage" } as const;

/**
 * A collection can have only one text index, and changing its options needs a
 * drop and recreate (createIndex fails with IndexOptionsConflict otherwise).
 * This drops any existing text index whose name or language options differ,
 * then creates the wanted one. It runs on every boot and is a no-op once in place.
 */
async function ensureTextIndex<T extends Document>(
  coll: Collection<T>,
  keys: IndexSpecification,
  opts: CreateIndexesOptions & { name: string },
): Promise<void> {
  const existing = await coll.indexes().catch(() => [] as Document[]);
  for (const idx of existing) {
    const isText = Object.values(idx.key ?? {}).includes("text");
    if (!isText) continue;
    const same =
      idx.name === opts.name &&
      idx.default_language === TEXT_OPTS.default_language &&
      idx.language_override === TEXT_OPTS.language_override;
    if (!same) await coll.dropIndex(idx.name as string);
  }
  await coll.createIndex(keys, { ...opts, ...TEXT_OPTS });
}

export async function ensureIndexes(db: Db): Promise<void> {
  const c = collections(db);
  await Promise.all([
    // Users
    c.users.createIndex({ usernameLower: 1 }, { unique: true, name: "uniq_username" }),
    c.users.createIndex({ email: 1 }, { unique: true, name: "uniq_email" }),
    c.users.createIndex({ role: 1, joinedAt: -1 }),
    c.users.createIndex({ badges: 1 }),
    c.users.createIndex({ joinedAt: -1 }),
    ensureTextIndex(
      c.users,
      { name: "text", username: "text", headline: "text", university: "text" },
      { name: "users_text", weights: { name: 5, username: 5, headline: 2, university: 1 } },
    ),

    // Sessions — TTL purges expired sessions automatically
    c.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    c.sessions.createIndex({ userId: 1 }),

    // Articles
    c.articles.createIndex({ slug: 1 }, { unique: true, name: "uniq_slug" }),
    c.articles.createIndex({ status: 1, publishedAt: -1 }),
    c.articles.createIndex({ status: 1, category: 1, publishedAt: -1 }),
    c.articles.createIndex({ authorId: 1, status: 1, updatedAt: -1 }),
    c.articles.createIndex({ status: 1, featured: 1, publishedAt: -1 }),
    c.articles.createIndex({ status: 1, "stats.likes": -1 }),
    ensureTextIndex(
      c.articles,
      { title: "text", subtitle: "text", excerpt: "text", tags: "text", body: "text" },
      { name: "articles_text", weights: { title: 10, subtitle: 5, tags: 5, excerpt: 3, body: 1 } },
    ),

    // Comments
    c.comments.createIndex({ targetType: 1, targetId: 1, createdAt: 1 }),
    c.comments.createIndex({ authorId: 1, createdAt: -1 }),

    // Debates & arguments
    c.debates.createIndex({ slug: 1 }, { unique: true, name: "uniq_slug" }),
    c.debates.createIndex({ opensAt: -1 }),
    c.debates.createIndex({ closesAt: -1 }),
    ensureTextIndex(c.debates, { title: "text", question: "text" }, { name: "debates_text" }),
    c.arguments.createIndex({ debateId: 1, createdAt: 1 }),
    c.arguments.createIndex({ authorId: 1, createdAt: -1 }),
    c.arguments.createIndex({ parentId: 1 }),

    // Discussions
    c.discussions.createIndex({ slug: 1 }, { unique: true, name: "uniq_slug" }),
    c.discussions.createIndex({ status: 1, pinned: -1, lastActivityAt: -1 }),
    c.discussions.createIndex({ topic: 1, lastActivityAt: -1 }),
    c.discussions.createIndex({ authorId: 1, createdAt: -1 }),
    ensureTextIndex(c.discussions, { title: "text", body: "text" }, { name: "discussions_text", weights: { title: 5, body: 1 } }),

    // Community & research
    c.initiatives.createIndex({ slug: 1 }, { unique: true, name: "uniq_slug" }),
    c.initiatives.createIndex({ kind: 1, startsAt: -1 }),
    c.ambassadors.createIndex({ userId: 1 }, { unique: true }),
    c.research.createIndex({ slug: 1 }, { unique: true, name: "uniq_slug" }),
    c.research.createIndex({ field: 1, publishedAt: -1 }),
    ensureTextIndex(
      c.research,
      { title: "text", abstract: "text", keywords: "text" },
      { name: "research_text", weights: { title: 10, keywords: 5, abstract: 2 } },
    ),

    // Moderation
    c.reports.createIndex({ status: 1, createdAt: -1 }),
    c.reports.createIndex({ reporterId: 1, targetType: 1, targetId: 1 }),

    // Reactions — one per user per target
    c.likes.createIndex({ userId: 1, targetType: 1, targetId: 1 }, { unique: true }),
    c.votes.createIndex({ userId: 1, argumentId: 1 }, { unique: true }),
    c.bookmarks.createIndex({ userId: 1, articleId: 1 }, { unique: true }),
    c.bookmarks.createIndex({ userId: 1, createdAt: -1 }),

    // Rate limiting buckets expire on their own
    c.rateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),

    // Google accounts: one FORUM user per Google subject (only for users that have one)
    c.users.createIndex(
      { googleId: 1 },
      { unique: true, name: "uniq_google", partialFilterExpression: { googleId: { $type: "string" } } },
    ),

    // One-time email codes (verification / password reset) expire on their own
    c.emailCodes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    c.emailCodes.createIndex({ userId: 1, purpose: 1 }),

    // Follows: one per pair; "who follows X" lookups
    c.follows.createIndex({ followerId: 1, followeeId: 1 }, { unique: true, name: "uniq_follow" }),
    c.follows.createIndex({ followeeId: 1, createdAt: -1 }),

    // Newsletter: one row per address
    c.newsletter.createIndex({ email: 1 }, { unique: true, name: "uniq_email" }),
  ]);
}
