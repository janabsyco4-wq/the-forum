/**
 * Seeds MongoDB Atlas with the frontend's sample fixtures
 * (src/lib/data/mock/fixtures/*.ts).
 *
 *   npm run db:seed            # upsert sample data (idempotent; safe to re-run)
 *   npm run db:seed -- --reset # wipe content collections first (asks nothing — be sure!)
 *
 * Demo accounts: every fixture user gets the email `<username>@demo.example.com`
 * and the password from SEED_DEMO_PASSWORD (≥ 10 chars). If that variable is
 * unset, a random password is generated and printed once to this terminal.
 * Passwords are hashed with argon2id like real ones; demo accounts are never
 * created in production (NODE_ENV=production) unless you pass --allow-production.
 *
 * Fixture ids ("u1", "a3", …) are turned into stable ObjectIds via a hash, so
 * references between fixtures stay intact and re-seeding updates in place.
 */
import { createHash, randomBytes } from "node:crypto";
import { ObjectId, type AnyBulkWriteOperation, type Document } from "mongodb";
import * as fx from "../src/lib/data/mock/fixtures";
import { closeDb, getDb } from "../src/server/db/client";
import {
  collections,
  type AmbassadorDoc,
  type ArgumentDoc,
  type ArticleDoc,
  type CategoryDoc,
  type CommentDoc,
  type DebateDoc,
  type DiscussionDoc,
  type InitiativeDoc,
  type ReportDoc,
  type ResearchDoc,
  type UserDoc,
} from "../src/server/db/collections";
import { effectiveDebateStatus } from "../src/server/db/mappers";
import { hashPassword } from "../src/server/auth/password";
import { sanitizeRichText } from "../src/server/security/sanitize";

const args = new Set(process.argv.slice(2));
const RESET = args.has("--reset");

/** Stable ObjectId for a fixture id. Real 24-hex ids pass through unchanged. */
function oid(id: string): ObjectId {
  if (/^[a-f0-9]{24}$/i.test(id)) return new ObjectId(id);
  return new ObjectId(createHash("sha1").update(`the-forum-seed:${id}`).digest("hex").slice(0, 24));
}
const d = (iso: string) => new Date(iso);
const dOpt = (iso?: string) => (iso ? new Date(iso) : undefined);

function strip<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k];
  return o;
}

async function upsertAll<T extends Document & { _id: unknown }>(
  coll: { bulkWrite(ops: AnyBulkWriteOperation<T>[]): Promise<unknown> },
  docs: T[],
) {
  if (!docs.length) return 0;
  await coll.bulkWrite(
    docs.map((doc) => ({ replaceOne: { filter: { _id: doc._id } as never, replacement: doc, upsert: true } })),
  );
  return docs.length;
}

async function main() {
  if (process.env.NODE_ENV === "production" && !args.has("--allow-production")) {
    throw new Error("Refusing to seed demo accounts with NODE_ENV=production (pass --allow-production to override).");
  }
  let password = process.env.SEED_DEMO_PASSWORD;
  let generated = false;
  if (!password) {
    password = randomBytes(12).toString("base64url");
    generated = true;
  }
  if (password.length < 10) throw new Error("SEED_DEMO_PASSWORD must be at least 10 characters.");

  const db = await getDb(); // also ensures indexes
  const c = collections(db);
  console.log(`Seeding database "${db.databaseName}"…`);

  if (RESET) {
    const names = [
      "users", "sessions", "categories", "articles", "comments", "debates", "arguments", "discussions",
      "initiatives", "ambassadors", "research", "reports", "likes", "votes", "bookmarks",
    ] as const;
    for (const n of names) await c[n].deleteMany({});
    console.log("  --reset: cleared content collections (indexes kept)");
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  // Keep existing real (non-fixture) accounts untouched; fixture users are matched by their stable id.
  const users: UserDoc[] = fx.users.map((u) =>
    strip({
      _id: oid(u.id),
      username: u.username,
      usernameLower: u.username.toLowerCase(),
      name: u.name,
      email: `${u.username.toLowerCase()}@demo.example.com`,
      emailVerified: true,
      passwordHash,
      preferredLocale: /[؀-ۿ]/.test(u.name) ? ("ur" as const) : ("en" as const),
      avatarUrl: u.avatarUrl,
      headline: u.headline,
      bio: u.bio,
      university: u.university,
      city: u.city,
      country: u.country,
      website: u.website,
      role: u.role,
      status: u.status,
      badges: u.badges,
      interests: u.interests,
      joinedAt: d(u.joinedAt),
      updatedAt: now,
      stats: u.stats,
    }),
  );

  const categories: CategoryDoc[] = fx.categories.map((cat, i) => ({
    _id: cat.slug,
    name: cat.name,
    description: cat.description,
    order: i,
  }));

  const articles: ArticleDoc[] = fx.articles.map((a) =>
    strip({
      _id: oid(a.id),
      slug: a.slug,
      title: a.title,
      subtitle: a.subtitle,
      excerpt: a.excerpt,
      body: sanitizeRichText(a.body),
      type: a.type,
      category: a.category,
      tags: a.tags,
      language: a.language,
      coverImage: a.coverImage,
      coverAlt: a.coverAlt,
      authorId: oid(a.authorId),
      status: a.status,
      featured: a.featured,
      editorsPick: a.editorsPick,
      readingMinutes: a.readingMinutes,
      createdAt: d(a.createdAt),
      updatedAt: d(a.updatedAt),
      publishedAt: dOpt(a.publishedAt),
      stats: a.stats,
      moderationNote: a.moderationNote,
    }),
  );

  const comments: CommentDoc[] = fx.comments.map((x) =>
    strip({
      _id: oid(x.id),
      targetType: x.targetType,
      targetId: oid(x.targetId),
      parentId: x.parentId ? oid(x.parentId) : undefined,
      authorId: oid(x.authorId),
      body: x.body,
      createdAt: d(x.createdAt),
      likes: x.likes,
      status: x.status,
    }),
  );

  const debates: DebateDoc[] = fx.debates.map((x) => {
    const base = strip({
      _id: oid(x.id),
      slug: x.slug,
      title: x.title,
      question: x.question,
      context: sanitizeRichText(x.context),
      category: x.category,
      language: x.language,
      coverImage: x.coverImage,
      weekNumber: x.weekNumber,
      opensAt: d(x.opensAt),
      closesAt: d(x.closesAt),
      sides: x.sides,
      readings: x.readings,
      createdBy: oid(x.createdBy),
      conclusion: x.conclusion
        ? strip({
            summary: x.conclusion.summary,
            body: sanitizeRichText(x.conclusion.body),
            authorId: oid(x.conclusion.authorId),
            publishedAt: d(x.conclusion.publishedAt),
            verdict: x.conclusion.verdict,
          })
        : undefined,
      stats: x.stats,
      createdAt: d(x.opensAt),
      updatedAt: now,
    });
    return { ...base, status: effectiveDebateStatus(base) };
  });

  const args_: ArgumentDoc[] = fx.debateArguments.map((g) =>
    strip({
      _id: oid(g.id),
      debateId: oid(g.debateId),
      authorId: oid(g.authorId),
      kind: g.kind,
      side: g.side,
      parentId: g.parentId ? oid(g.parentId) : undefined,
      title: g.title,
      body: g.body,
      createdAt: d(g.createdAt),
      votes: g.votes,
      status: g.status,
      highlighted: g.highlighted,
    }),
  );

  const discussions: DiscussionDoc[] = fx.discussions.map((x) => ({
    _id: oid(x.id),
    slug: x.slug,
    title: x.title,
    body: x.body,
    topic: x.topic,
    language: x.language,
    authorId: oid(x.authorId),
    createdAt: d(x.createdAt),
    lastActivityAt: d(x.lastActivityAt),
    pinned: x.pinned,
    locked: x.locked,
    status: x.status,
    stats: x.stats,
  }));

  const initiatives: InitiativeDoc[] = fx.initiatives.map((x) =>
    strip({
      _id: oid(x.id),
      slug: x.slug,
      kind: x.kind,
      title: x.title,
      summary: x.summary,
      body: sanitizeRichText(x.body),
      status: x.status,
      coverImage: x.coverImage,
      city: x.city,
      partner: x.partner,
      organizerId: oid(x.organizerId),
      startsAt: d(x.startsAt),
      endsAt: dOpt(x.endsAt),
      goal: x.goal,
      prize: x.prize,
      participants: x.participants,
      tags: x.tags,
    }),
  );

  const ambassadors: AmbassadorDoc[] = fx.ambassadors.map((x) => ({
    _id: oid(x.userId),
    userId: oid(x.userId),
    university: x.university,
    city: x.city,
    since: d(x.since),
    chapterSize: x.chapterSize,
  }));

  const research: ResearchDoc[] = fx.research.map((x) =>
    strip({
      _id: oid(x.id),
      slug: x.slug,
      title: x.title,
      abstract: x.abstract,
      type: x.type,
      field: x.field,
      authorIds: x.authorIds.map(oid),
      supervisor: x.supervisor,
      institution: x.institution,
      publishedAt: d(x.publishedAt),
      keywords: x.keywords,
      pdfUrl: x.pdfUrl,
      doi: x.doi,
      stats: x.stats,
      peerReviewed: x.peerReviewed,
    }),
  );

  const reports: ReportDoc[] = fx.reports.map((x) =>
    strip({
      _id: oid(x.id),
      targetType: x.targetType,
      targetId: oid(x.targetId),
      targetPreview: x.targetPreview,
      reason: x.reason,
      details: x.details,
      reporterId: oid(x.reporterId),
      createdAt: d(x.createdAt),
      status: x.status,
      resolvedBy: x.resolvedBy ? oid(x.resolvedBy) : undefined,
      resolution: x.resolution,
    }),
  );

  // A real account may already own a fixture's username/email: skip those fixtures instead of failing.
  const clashes = await c.users
    .find({
      _id: { $nin: users.map((u) => u._id) },
      $or: [{ usernameLower: { $in: users.map((u) => u.usernameLower) } }, { email: { $in: users.map((u) => u.email) } }],
    })
    .project<{ usernameLower: string; email: string }>({ usernameLower: 1, email: 1 })
    .toArray();
  const taken = new Set(clashes.flatMap((x) => [x.usernameLower, x.email]));
  const seedUsers = users.filter((u) => !taken.has(u.usernameLower) && !taken.has(u.email));
  if (seedUsers.length < users.length) {
    console.warn(`  skipped ${users.length - seedUsers.length} demo user(s) whose username/email is used by a real account`);
  }

  const counts = {
    users: await upsertAll(c.users, seedUsers),
    categories: await upsertAll(c.categories, categories),
    articles: await upsertAll(c.articles, articles),
    comments: await upsertAll(c.comments, comments),
    debates: await upsertAll(c.debates, debates),
    arguments: await upsertAll(c.arguments, args_),
    discussions: await upsertAll(c.discussions, discussions),
    initiatives: await upsertAll(c.initiatives, initiatives),
    ambassadors: await upsertAll(c.ambassadors, ambassadors),
    research: await upsertAll(c.research, research),
    reports: await upsertAll(c.reports, reports),
  };
  console.table(counts);

  console.log("\nDemo sign-in: any fixture user, e.g.");
  console.log(`  email:    ${seedUsers[0]?.email ?? "(none)"}`);
  if (generated) {
    console.log(`  password: ${password}   ← generated now and NOT stored anywhere; set SEED_DEMO_PASSWORD to choose your own`);
  } else {
    console.log("  password: the value of SEED_DEMO_PASSWORD");
  }
  const staff = seedUsers.filter((u) => u.role === "admin" || u.role === "moderator");
  if (staff.length) console.log(`  staff accounts: ${staff.map((u) => `${u.email} (${u.role})`).join(", ")}`);
}

main()
  .catch((e) => {
    console.error("\nSeed failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
