import type { DataSource } from "../contract";
import type { AdminStats, Article, Paginated } from "@/types/domain";
import * as fx from "./fixtures";

function paginate<T>(all: T[], page = 1, pageSize = 12): Paginated<T> {
  const start = (page - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), total: all.length, page, pageSize };
}

const includes = (hay: string, needle: string) => hay.toLowerCase().includes(needle.toLowerCase());

const byDate = <T>(key: (x: T) => string | undefined) => (a: T, b: T) =>
  new Date(key(b) ?? 0).getTime() - new Date(key(a) ?? 0).getTime();

/** In-memory read-only source backed by the sample fixtures. Nothing here persists. */
export const mockSource: DataSource = {
  async getUserById(id) {
    return fx.users.find((u) => u.id === id) ?? null;
  },
  async getUserByUsername(username) {
    return fx.users.find((u) => u.username === username) ?? null;
  },
  async getUsersByIds(ids) {
    return fx.users.filter((u) => ids.includes(u.id));
  },
  async listUsers(q = {}) {
    let list = fx.users;
    if (q.role) list = list.filter((u) => u.role === q.role);
    if (q.search) list = list.filter((u) => includes(u.name + u.username + (u.university ?? ""), q.search!));
    return paginate(list, q.page, q.pageSize ?? 50);
  },
  async listFeaturedWriters(limit = 6) {
    return fx.users
      .filter((u) => u.badges.includes("featured-writer"))
      .sort((a, b) => b.stats.followers - a.stats.followers)
      .slice(0, limit);
  },
  async getCurrentUser() {
    return null; // No real authentication in the prototype.
  },
  async isFollowing() {
    return false; // Nobody is signed in in the prototype.
  },

  async listCategories() {
    return fx.categories;
  },
  async listArticles(q = {}) {
    const status = q.status ?? "published";
    let list: Article[] = fx.articles.filter((a) => a.status === status);
    if (q.category) list = list.filter((a) => a.category === q.category);
    if (q.type) list = list.filter((a) => a.type === q.type);
    if (q.language) list = list.filter((a) => a.language === q.language);
    if (q.authorId) list = list.filter((a) => a.authorId === q.authorId);
    if (q.featured !== undefined) list = list.filter((a) => a.featured === q.featured);
    if (q.editorsPick !== undefined) list = list.filter((a) => a.editorsPick === q.editorsPick);
    if (q.search) list = list.filter((a) => includes(`${a.title} ${a.excerpt} ${a.tags.join(" ")}`, q.search!));
    const sort = q.sort ?? "latest";
    list = [...list].sort(
      sort === "popular"
        ? (a, b) => b.stats.views - a.stats.views
        : sort === "discussed"
          ? (a, b) => b.stats.comments - a.stats.comments
          : byDate<Article>((a) => a.publishedAt ?? a.updatedAt),
    );
    return paginate(list, q.page, q.pageSize);
  },
  async getArticleBySlug(slug) {
    return fx.articles.find((a) => a.slug === slug) ?? null;
  },
  async listComments(targetType, targetId) {
    return fx.comments
      .filter((c) => c.targetType === targetType && c.targetId === targetId && c.status === "visible")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async listDebates(q = {}) {
    const list = q.status ? fx.debates.filter((d) => d.status === q.status) : fx.debates;
    return [...list].sort((a, b) => b.weekNumber - a.weekNumber);
  },
  async getCurrentDebate() {
    return fx.debates.find((d) => d.status === "open") ?? null;
  },
  async getDebateBySlug(slug) {
    return fx.debates.find((d) => d.slug === slug) ?? null;
  },
  async listArguments(debateId) {
    return fx.debateArguments.filter((g) => g.debateId === debateId && g.status === "visible");
  },
  async listArgumentsByAuthor(authorId) {
    return fx.debateArguments.filter((g) => g.authorId === authorId).sort(byDate((g) => g.createdAt));
  },

  async listDiscussions(q = {}) {
    let list = fx.discussions.filter((d) => d.status === "visible");
    if (q.topic) list = list.filter((d) => d.topic === q.topic);
    if (q.authorId) list = list.filter((d) => d.authorId === q.authorId);
    if (q.search) list = list.filter((d) => includes(d.title + d.body, q.search!));
    const sort = q.sort ?? "active";
    list = [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "popular") return b.stats.replies - a.stats.replies;
      const key = sort === "latest" ? "createdAt" : "lastActivityAt";
      return new Date(b[key]).getTime() - new Date(a[key]).getTime();
    });
    return paginate(list, q.page, q.pageSize ?? 20);
  },
  async getDiscussionBySlug(slug) {
    return fx.discussions.find((d) => d.slug === slug) ?? null;
  },

  async listInitiatives(q = {}) {
    return q.kind ? fx.initiatives.filter((i) => i.kind === q.kind) : fx.initiatives;
  },
  async getInitiativeBySlug(slug) {
    return fx.initiatives.find((i) => i.slug === slug) ?? null;
  },
  async listAmbassadors() {
    return fx.ambassadors;
  },
  async listResearch(q = {}) {
    let list = fx.research;
    if (q.field) list = list.filter((r) => r.field === q.field);
    if (q.type) list = list.filter((r) => r.type === q.type);
    if (q.search) list = list.filter((r) => includes(r.title + r.abstract + r.keywords.join(" "), q.search!));
    return [...list].sort(byDate((r) => r.publishedAt));
  },
  async getResearchBySlug(slug) {
    return fx.research.find((r) => r.slug === slug) ?? null;
  },

  async listReports(q = {}) {
    const list = q.status ? fx.reports.filter((r) => r.status === q.status) : fx.reports;
    return [...list].sort(byDate((r) => r.createdAt));
  },
  async getAdminStats(): Promise<AdminStats> {
    const now = Date.now();
    const weekly = Array.from({ length: 12 }, (_, i) => {
      const w = 11 - i;
      const growth = 1 + i * 0.09;
      return {
        weekStart: new Date(now - w * 7 * 86_400_000).toISOString(),
        signups: Math.round((140 + ((i * 37) % 60)) * growth),
        articles: Math.round((22 + ((i * 13) % 14)) * growth),
        arguments: Math.round((150 + ((i * 53) % 90)) * growth),
      };
    });
    const counts = new Map<string, number>();
    fx.articles.forEach((a) => counts.set(a.category, (counts.get(a.category) ?? 0) + 1));
    return {
      totals: {
        users: 12480,
        articles: 2316,
        pendingArticles: fx.articles.filter((a) => a.status === "pending").length,
        openReports: fx.reports.filter((r) => r.status === "open" || r.status === "reviewing").length,
        activeDebates: fx.debates.filter((d) => d.status === "open").length,
        discussions: 1840,
      },
      weekly,
      topCategories: [...counts.entries()]
        .map(([slug, n]) => ({ slug, articles: n * 97 }))
        .sort((a, b) => b.articles - a.articles)
        .slice(0, 6),
      topUniversities: [
        { name: "LUMS", members: 1840 },
        { name: "University of the Punjab", members: 1620 },
        { name: "NUST", members: 1410 },
        { name: "University of Karachi", members: 1190 },
        { name: "Quaid-i-Azam University", members: 980 },
        { name: "IBA Karachi", members: 760 },
      ],
    };
  },
};
