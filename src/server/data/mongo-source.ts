/**
 * MongoDB implementation of the read-side DataSource (src/lib/data/contract.ts).
 * Selected by DATA_SOURCE=mongo in src/lib/data/index.ts.
 *
 * Visibility rules enforced here (pages cannot accidentally leak):
 *  - non-published articles: only their author, moderators and admins;
 *  - hidden/removed comments, arguments and discussions are never listed;
 *  - suspended users are hidden from public listings (not from staff);
 *  - reports and admin stats require moderator/admin, else AccessDeniedError.
 */
import "server-only";
import type { Filter, Sort } from "mongodb";
import type { ArticleQuery, DataSource, DiscussionQuery, UserQuery } from "@/lib/data/contract";
import type { AdminStats, DebateStatus, Paginated } from "@/types/domain";
import {
  cols,
  toAmbassador,
  toArgument,
  toArticle,
  toCategory,
  toComment,
  toDebate,
  toDiscussion,
  toInitiative,
  toObjectId,
  toReport,
  toResearch,
  toUser,
  type ArticleDoc,
  type DebateDoc,
  type DiscussionDoc,
  type ResearchDoc,
  type UserDoc,
} from "../db";
import { getCurrentUser, getCurrentUserDoc, hasRole } from "../auth";
import { escapeRegex } from "../lib/text";
import { isFollowing as isFollowingSvc } from "../services/social";

export class AccessDeniedError extends Error {
  constructor(what: string) {
    super(`Access denied: ${what} requires a moderator or admin account.`);
    this.name = "AccessDeniedError";
  }
}

const MAX_PAGE_SIZE = 50;

function pageOpts(page = 1, pageSize = 12) {
  const p = Math.max(1, Math.floor(page) || 1);
  const s = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize) || 12));
  return { page: p, pageSize: s, skip: (p - 1) * s };
}

async function viewerIsStaff(): Promise<boolean> {
  return hasRole(await getCurrentUserDoc().catch(() => null), "moderator");
}

/** Text search when the query has real words; otherwise a case-insensitive regex. */
function searchFilter<T>(search: string | undefined, regexFields: string[]): Filter<T> {
  const s = search?.trim().slice(0, 100);
  if (!s) return {};
  // $text is fast and ranked, but cannot match partial words; short queries use a prefix regex instead.
  if (s.length >= 3) return { $text: { $search: s } } as Filter<T>;
  const rx = new RegExp(escapeRegex(s), "i");
  return { $or: regexFields.map((f) => ({ [f]: rx })) } as Filter<T>;
}

function debateStatusFilter(status: DebateStatus, now = new Date()): Filter<DebateDoc> {
  switch (status) {
    case "concluded":
      return { conclusion: { $exists: true } };
    case "upcoming":
      return { conclusion: { $exists: false }, opensAt: { $gt: now } };
    case "open":
      return { conclusion: { $exists: false }, opensAt: { $lte: now }, closesAt: { $gt: now } };
    case "closed":
      return { conclusion: { $exists: false }, closesAt: { $lte: now } };
  }
}

export const mongoSource: DataSource = {
  // ── Users ──
  async getUserById(id) {
    const _id = toObjectId(id);
    if (!_id) return null;
    const { users } = await cols();
    const d = await users.findOne({ _id });
    return d ? toUser(d) : null;
  },

  async getUserByUsername(username) {
    const { users } = await cols();
    const d = await users.findOne({ usernameLower: username.toLowerCase() });
    return d ? toUser(d) : null;
  },

  async getUsersByIds(ids) {
    const oids = ids.map(toObjectId).filter((x) => x !== null);
    if (!oids.length) return [];
    const { users } = await cols();
    return (await users.find({ _id: { $in: oids } }).toArray()).map(toUser);
  },

  async listUsers(q: UserQuery = {}) {
    const { page, pageSize, skip } = pageOpts(q.page, q.pageSize ?? 50);
    const filter: Filter<UserDoc> = {
      ...(q.role ? { role: q.role } : {}),
      ...(!(await viewerIsStaff()) ? { status: { $ne: "suspended" } } : {}),
      ...searchFilter<UserDoc>(q.search, ["name", "username", "university"]),
    };
    const { users } = await cols();
    const [items, total] = await Promise.all([
      users.find(filter).sort({ "stats.followers": -1, joinedAt: -1 }).skip(skip).limit(pageSize).toArray(),
      users.countDocuments(filter),
    ]);
    return { items: items.map(toUser), total, page, pageSize };
  },

  async listFeaturedWriters(limit = 6) {
    const { users } = await cols();
    const docs = await users
      .find({ badges: "featured-writer", status: "active" })
      .sort({ "stats.followers": -1 })
      .limit(Math.min(limit, MAX_PAGE_SIZE))
      .toArray();
    return docs.map(toUser);
  },

  async getCurrentUser() {
    return getCurrentUser();
  },

  // Spread so this compiles both before and after `isFollowing` lands in the DataSource contract.
  ...{
    /** True when the signed-in viewer follows `userId`; false when signed out. */
    async isFollowing(userId: string): Promise<boolean> {
      const me = await getCurrentUserDoc().catch(() => null);
      return me ? isFollowingSvc(me._id, userId) : false;
    },
  },

  // ── Publishing ──
  async listCategories() {
    const { categories } = await cols();
    return (await categories.find({}).sort({ order: 1, _id: 1 }).toArray()).map(toCategory);
  },

  async listArticles(q: ArticleQuery = {}) {
    const { page, pageSize, skip } = pageOpts(q.page, q.pageSize);
    const status = q.status ?? "published";
    const empty: Paginated<never> = { items: [], total: 0, page, pageSize };

    const authorId = q.authorId !== undefined ? toObjectId(q.authorId) : undefined;
    if (q.authorId !== undefined && !authorId) return empty;

    if (status !== "published") {
      const me = await getCurrentUserDoc().catch(() => null);
      const isOwn = !!me && !!authorId && me._id.equals(authorId);
      if (!isOwn && !hasRole(me, "moderator")) return empty;
    }

    const filter: Filter<ArticleDoc> = {
      status,
      ...(q.category ? { category: q.category } : {}),
      ...(q.type ? { type: q.type } : {}),
      ...(q.language ? { language: q.language } : {}),
      ...(authorId ? { authorId } : {}),
      ...(q.featured !== undefined ? { featured: q.featured } : {}),
      ...(q.editorsPick !== undefined ? { editorsPick: q.editorsPick } : {}),
      ...searchFilter<ArticleDoc>(q.search, ["title", "excerpt", "tags"]),
    };
    const sort: Sort =
      q.sort === "popular"
        ? { "stats.views": -1, _id: -1 }
        : q.sort === "discussed"
          ? { "stats.comments": -1, _id: -1 }
          : status === "published"
            ? { publishedAt: -1, _id: -1 }
            : { updatedAt: -1, _id: -1 };

    const { articles } = await cols();
    const [items, total] = await Promise.all([
      articles.find(filter).sort(sort).skip(skip).limit(pageSize).toArray(),
      articles.countDocuments(filter),
    ]);
    return { items: items.map(toArticle), total, page, pageSize };
  },

  async getArticleBySlug(slug) {
    const { articles } = await cols();
    const d = await articles.findOne({ slug });
    if (!d) return null;
    if (d.status === "published") return toArticle(d);
    const me = await getCurrentUserDoc().catch(() => null);
    if (me && (me._id.equals(d.authorId) || hasRole(me, "moderator"))) return toArticle(d);
    return null;
  },

  async listComments(targetType, targetId) {
    const _id = toObjectId(targetId);
    if (!_id) return [];
    const { comments } = await cols();
    const docs = await comments.find({ targetType, targetId: _id, status: "visible" }).sort({ createdAt: 1 }).limit(1000).toArray();
    return docs.map(toComment);
  },

  // ── Debates ──
  async listDebates(q = {}) {
    const { debates } = await cols();
    const docs = await debates
      .find(q.status ? debateStatusFilter(q.status) : {})
      .sort({ weekNumber: -1, opensAt: -1 })
      .limit(200)
      .toArray();
    return docs.map(toDebate);
  },

  async getCurrentDebate() {
    const { debates } = await cols();
    const d = await debates.find(debateStatusFilter("open")).sort({ opensAt: -1 }).limit(1).next();
    return d ? toDebate(d) : null;
  },

  async getDebateBySlug(slug) {
    const { debates } = await cols();
    const d = await debates.findOne({ slug });
    return d ? toDebate(d) : null;
  },

  async listArguments(debateId) {
    const _id = toObjectId(debateId);
    if (!_id) return [];
    const { arguments: args } = await cols();
    return (await args.find({ debateId: _id, status: "visible" }).sort({ createdAt: 1 }).limit(2000).toArray()).map(toArgument);
  },

  async listArgumentsByAuthor(authorId) {
    const _id = toObjectId(authorId);
    if (!_id) return [];
    const { arguments: args } = await cols();
    return (await args.find({ authorId: _id, status: "visible" }).sort({ createdAt: -1 }).limit(200).toArray()).map(toArgument);
  },

  // ── Discussions ──
  async listDiscussions(q: DiscussionQuery = {}) {
    const { page, pageSize, skip } = pageOpts(q.page, q.pageSize ?? 20);
    const authorId = q.authorId !== undefined ? toObjectId(q.authorId) : undefined;
    if (q.authorId !== undefined && !authorId) return { items: [], total: 0, page, pageSize };
    const filter: Filter<DiscussionDoc> = {
      status: "visible",
      ...(q.topic ? { topic: q.topic } : {}),
      ...(authorId ? { authorId } : {}),
      ...searchFilter<DiscussionDoc>(q.search, ["title", "body"]),
    };
    const sort: Sort =
      q.sort === "popular"
        ? { pinned: -1, "stats.replies": -1, _id: -1 }
        : q.sort === "latest"
          ? { pinned: -1, createdAt: -1 }
          : { pinned: -1, lastActivityAt: -1 };
    const { discussions } = await cols();
    const [items, total] = await Promise.all([
      discussions.find(filter).sort(sort).skip(skip).limit(pageSize).toArray(),
      discussions.countDocuments(filter),
    ]);
    return { items: items.map(toDiscussion), total, page, pageSize };
  },

  async getDiscussionBySlug(slug) {
    const { discussions } = await cols();
    const d = await discussions.findOne({ slug });
    if (!d) return null;
    if (d.status !== "visible" && !(await viewerIsStaff())) return null;
    return toDiscussion(d);
  },

  // ── Community & research ──
  async listInitiatives(q = {}) {
    const { initiatives } = await cols();
    return (await initiatives.find(q.kind ? { kind: q.kind } : {}).sort({ startsAt: -1 }).limit(200).toArray()).map(toInitiative);
  },

  async getInitiativeBySlug(slug) {
    const { initiatives } = await cols();
    const d = await initiatives.findOne({ slug });
    return d ? toInitiative(d) : null;
  },

  async listAmbassadors() {
    const { ambassadors } = await cols();
    return (await ambassadors.find({}).sort({ since: 1 }).limit(500).toArray()).map(toAmbassador);
  },

  async listResearch(q = {}) {
    const filter: Filter<ResearchDoc> = {
      ...(q.field ? { field: q.field } : {}),
      ...(q.type ? { type: q.type } : {}),
      ...searchFilter<ResearchDoc>(q.search, ["title", "abstract", "keywords"]),
    };
    const { research } = await cols();
    return (await research.find(filter).sort({ publishedAt: -1 }).limit(200).toArray()).map(toResearch);
  },

  async getResearchBySlug(slug) {
    const { research } = await cols();
    const d = await research.findOne({ slug });
    return d ? toResearch(d) : null;
  },

  // ── Admin ──
  async listReports(q = {}) {
    if (!(await viewerIsStaff())) throw new AccessDeniedError("listReports");
    const { reports } = await cols();
    return (await reports.find(q.status ? { status: q.status } : {}).sort({ createdAt: -1 }).limit(500).toArray()).map(toReport);
  },

  async getAdminStats(): Promise<AdminStats> {
    if (!(await viewerIsStaff())) throw new AccessDeniedError("getAdminStats");
    const c = await cols();
    const now = new Date();

    // Monday 00:00 UTC of the week 11 weeks ago → 12 buckets, oldest first.
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const starts = Array.from({ length: 12 }, (_, i) => new Date(monday.getTime() - (11 - i) * 7 * 86_400_000));
    const from = starts[0]!;
    const weekIndex = (field: string) => ({
      $floor: { $divide: [{ $subtract: [`$${field}`, from] }, 7 * 86_400_000] },
    });
    const weekly = async (coll: typeof c.users | typeof c.articles | typeof c.arguments, field: string) => {
      const rows = await (coll as typeof c.users)
        .aggregate<{ _id: number; n: number }>([
          { $match: { [field]: { $gte: from } } },
          { $group: { _id: weekIndex(field), n: { $sum: 1 } } },
        ])
        .toArray();
      const out = new Array(12).fill(0) as number[];
      for (const r of rows) if (r._id >= 0 && r._id < 12) out[r._id] = r.n;
      return out;
    };

    const [users, articles, pendingArticles, openReports, activeDebates, discussions, su, ar, ag, topCategories, topUniversities] =
      await Promise.all([
        c.users.countDocuments({}),
        c.articles.countDocuments({ status: "published" }),
        c.articles.countDocuments({ status: "pending" }),
        c.reports.countDocuments({ status: { $in: ["open", "reviewing"] } }),
        c.debates.countDocuments(debateStatusFilter("open", now)),
        c.discussions.countDocuments({ status: "visible" }),
        weekly(c.users, "joinedAt"),
        weekly(c.articles, "createdAt"),
        weekly(c.arguments, "createdAt"),
        c.articles
          .aggregate<{ _id: string; n: number }>([
            { $match: { status: "published" } },
            { $group: { _id: "$category", n: { $sum: 1 } } },
            { $sort: { n: -1 } },
            { $limit: 6 },
          ])
          .toArray(),
        c.users
          .aggregate<{ _id: string; n: number }>([
            { $match: { university: { $nin: [null, ""] } } },
            { $group: { _id: "$university", n: { $sum: 1 } } },
            { $sort: { n: -1 } },
            { $limit: 6 },
          ])
          .toArray(),
      ]);

    return {
      totals: { users, articles, pendingArticles, openReports, activeDebates, discussions },
      weekly: starts.map((s, i) => ({ weekStart: s.toISOString(), signups: su[i]!, articles: ar[i]!, arguments: ag[i]! })),
      topCategories: topCategories.map((r) => ({ slug: r._id, articles: r.n })),
      topUniversities: topUniversities.map((r) => ({ name: r._id, members: r.n })),
    };
  },
};
