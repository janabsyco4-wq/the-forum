/**
 * SHARED CONTRACT — the read-side data interface every page uses.
 *
 * Pages (server components) only ever call `getData()` from `@/lib/data`.
 * Today it returns the mock source (src/lib/data/mock). The backend session
 * implements this same interface against MongoDB Atlas in
 * src/server/data/mongo-source.ts; switching is one line in src/lib/data/index.ts.
 *
 * Writes (create article, submit argument, login…) do NOT go through this
 * interface — they go through the HTTP API described in src/lib/api/contract.ts.
 */
import type {
  AdminStats,
  Ambassador,
  Article,
  ArticleStatus,
  ArticleType,
  Category,
  Comment,
  CommentTarget,
  Debate,
  DebateArgument,
  DebateStatus,
  Discussion,
  DiscussionTopic,
  Initiative,
  InitiativeKind,
  Locale,
  Paginated,
  PrivateUser,
  Report,
  ReportStatus,
  ResearchItem,
  ResearchType,
  User,
  UserRole,
} from "@/types/domain";

export interface ArticleQuery {
  category?: string;
  type?: ArticleType;
  language?: Locale;
  authorId?: string;
  status?: ArticleStatus; // default "published"
  featured?: boolean;
  editorsPick?: boolean;
  search?: string;
  sort?: "latest" | "popular" | "discussed";
  page?: number; // 1-based
  pageSize?: number;
}

export interface DiscussionQuery {
  topic?: DiscussionTopic;
  authorId?: string;
  search?: string;
  sort?: "active" | "latest" | "popular";
  page?: number;
  pageSize?: number;
}

export interface UserQuery {
  role?: UserRole;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DataSource {
  // Users
  getUserById(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  getUsersByIds(ids: string[]): Promise<User[]>;
  listUsers(q?: UserQuery): Promise<Paginated<User>>;
  listFeaturedWriters(limit?: number): Promise<User[]>;
  /** The signed-in user, or null. Mock always returns null (no real auth yet). */
  getCurrentUser(): Promise<PrivateUser | null>;
  /** True when the signed-in viewer follows `userId`; false when signed out. (added 2026-11-22) */
  isFollowing(userId: string): Promise<boolean>;

  // Publishing
  listCategories(): Promise<Category[]>;
  listArticles(q?: ArticleQuery): Promise<Paginated<Article>>;
  getArticleBySlug(slug: string): Promise<Article | null>;
  listComments(targetType: CommentTarget, targetId: string): Promise<Comment[]>;

  // Debates
  listDebates(q?: { status?: DebateStatus }): Promise<Debate[]>;
  getCurrentDebate(): Promise<Debate | null>;
  getDebateBySlug(slug: string): Promise<Debate | null>;
  listArguments(debateId: string): Promise<DebateArgument[]>;
  listArgumentsByAuthor(authorId: string): Promise<DebateArgument[]>;

  // Discussions
  listDiscussions(q?: DiscussionQuery): Promise<Paginated<Discussion>>;
  getDiscussionBySlug(slug: string): Promise<Discussion | null>;

  // Community & research
  listInitiatives(q?: { kind?: InitiativeKind }): Promise<Initiative[]>;
  getInitiativeBySlug(slug: string): Promise<Initiative | null>;
  listAmbassadors(): Promise<Ambassador[]>;
  listResearch(q?: { field?: string; type?: ResearchType; search?: string }): Promise<ResearchItem[]>;
  getResearchBySlug(slug: string): Promise<ResearchItem | null>;

  // Admin
  listReports(q?: { status?: ReportStatus }): Promise<Report[]>;
  getAdminStats(): Promise<AdminStats>;
}
