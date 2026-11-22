/**
 * SHARED CONTRACT — domain types used by both the frontend (pages, components,
 * mock data) and the backend (Mongo models, services, API routes).
 *
 * Rules: add fields freely (optional preferred). Do NOT rename or remove a
 * field without updating every consumer and noting it in CLAUDE.md.
 * IDs are strings (Mongo ObjectId serialised with .toString()).
 * Dates are ISO-8601 strings so objects are safe to pass to client components.
 */

export type Locale = "en" | "ur";

/** Text that may exist in both languages. `en` is always present. */
export interface LocalizedText {
  en: string;
  ur?: string;
}

export type ISODate = string;

// ───────────────────────────── Users ─────────────────────────────

export type UserRole = "member" | "writer" | "ambassador" | "moderator" | "admin";
export type UserStatus = "active" | "suspended" | "pending";

export type BadgeKey =
  | "featured-writer"
  | "top-debater"
  | "campus-ambassador"
  | "researcher"
  | "founding-member"
  | "editor-pick";

export interface UserStats {
  articles: number;
  arguments: number;
  discussions: number;
  followers: number;
  following: number;
}

/** Public profile — safe to send to any client. Never contains email/password. */
export interface User {
  id: string;
  username: string; // unique, url-safe
  name: string;
  avatarUrl?: string;
  headline?: string; // "Economics, LUMS '27"
  bio?: string;
  university?: string;
  city?: string;
  country?: string;
  website?: string;
  role: UserRole;
  status: UserStatus;
  badges: BadgeKey[];
  interests: string[]; // category slugs
  joinedAt: ISODate;
  stats: UserStats;
}

/** Only ever returned to the user themself or to admins. */
export interface PrivateUser extends User {
  email: string;
  emailVerified: boolean;
  preferredLocale: Locale;
}

// ─────────────────────────── Publishing ──────────────────────────

export type ArticleType = "article" | "essay" | "blog" | "opinion" | "research";
export type ArticleStatus = "draft" | "pending" | "published" | "rejected" | "archived";

export interface Category {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  /** Sanitised HTML produced by the rich-text editor (h2, h3, p, blockquote, ul, ol, li, strong, em, a, img, figure, figcaption). */
  body: string;
  type: ArticleType;
  category: string; // Category.slug
  tags: string[];
  language: Locale;
  coverImage?: string;
  coverAlt?: string;
  authorId: string;
  status: ArticleStatus;
  featured: boolean;
  editorsPick: boolean;
  readingMinutes: number;
  createdAt: ISODate;
  updatedAt: ISODate;
  publishedAt?: ISODate;
  stats: { views: number; likes: number; comments: number; bookmarks: number };
  moderationNote?: string;
}

// ──────────────────────────── Comments ───────────────────────────

export type CommentTarget = "article" | "discussion";

export interface Comment {
  id: string;
  targetType: CommentTarget;
  targetId: string;
  parentId?: string; // threaded replies
  authorId: string;
  body: string; // plain text (rendered with line breaks)
  createdAt: ISODate;
  likes: number;
  status: "visible" | "hidden" | "removed";
}

// ──────────────────────────── Debates ────────────────────────────

export type DebateStatus = "upcoming" | "open" | "closed" | "concluded";
export type DebateSide = "for" | "against" | "neutral";
export type ArgumentKind = "argument" | "counterargument" | "reply" | "solution";

export interface DebateConclusion {
  summary: string;
  body: string; // sanitised HTML
  authorId: string; // admin / moderator who wrote it
  publishedAt: ISODate;
  verdict?: DebateSide; // optional "house finds for…"
}

export interface Debate {
  id: string;
  slug: string;
  title: string; // "This House believes…"
  question: string;
  context: string; // sanitised HTML briefing
  category: string;
  language: Locale;
  coverImage?: string;
  weekNumber: number;
  opensAt: ISODate;
  closesAt: ISODate; // submission deadline
  status: DebateStatus;
  sides: { for: string; against: string }; // side labels
  readings: { title: string; url: string }[];
  createdBy: string; // admin user id
  conclusion?: DebateConclusion;
  stats: { arguments: number; participants: number; votesFor: number; votesAgainst: number };
}

export interface DebateArgument {
  id: string;
  debateId: string;
  authorId: string;
  kind: ArgumentKind;
  side: DebateSide;
  parentId?: string; // counterargument/reply -> the argument it answers
  title?: string;
  body: string; // plain text
  createdAt: ISODate;
  votes: number;
  status: "visible" | "hidden" | "removed";
  highlighted?: boolean; // picked by moderators
}

// ────────────────────────── Discussions ──────────────────────────

export type DiscussionTopic =
  | "current-affairs"
  | "society"
  | "politics"
  | "education"
  | "history"
  | "economy"
  | "science"
  | "culture"
  | "philosophy"
  | "other";

export interface Discussion {
  id: string;
  slug: string;
  title: string;
  body: string; // plain text
  topic: DiscussionTopic;
  language: Locale;
  authorId: string;
  createdAt: ISODate;
  lastActivityAt: ISODate;
  pinned: boolean;
  locked: boolean;
  status: "visible" | "hidden" | "removed";
  stats: { replies: number; views: number; participants: number };
}

// ─────────────────────── Community & Research ────────────────────

export type InitiativeKind = "initiative" | "research-challenge";
export type InitiativeStatus = "upcoming" | "open" | "ongoing" | "completed";

export interface Initiative {
  id: string;
  slug: string;
  kind: InitiativeKind;
  title: string;
  summary: string;
  body: string; // sanitised HTML
  status: InitiativeStatus;
  coverImage?: string;
  city?: string;
  partner?: string;
  organizerId: string;
  startsAt: ISODate;
  endsAt?: ISODate;
  goal?: string;
  prize?: string;
  participants: number;
  tags: string[];
}

export interface Ambassador {
  userId: string;
  university: string;
  city: string;
  since: ISODate;
  chapterSize: number;
}

export type ResearchType = "paper" | "policy-brief" | "dataset" | "challenge-entry" | "review";

export interface ResearchItem {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  type: ResearchType;
  field: string; // Category.slug
  authorIds: string[];
  supervisor?: string;
  institution?: string;
  publishedAt: ISODate;
  keywords: string[];
  pdfUrl?: string;
  doi?: string;
  stats: { reads: number; citations: number; downloads: number };
  peerReviewed: boolean;
}

// ─────────────────────────── Moderation ──────────────────────────

export type ReportTarget = "article" | "comment" | "discussion" | "argument" | "user";
export type ReportReason =
  | "spam"
  | "harassment"
  | "hate-speech"
  | "misinformation"
  | "plagiarism"
  | "off-topic"
  | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface Report {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  targetPreview: string; // snapshot of the reported text/title
  reason: ReportReason;
  details?: string;
  reporterId: string;
  createdAt: ISODate;
  status: ReportStatus;
  resolvedBy?: string;
  resolution?: string;
}

// ─────────────────────────── Analytics ───────────────────────────

export interface AdminStats {
  totals: {
    users: number;
    articles: number;
    pendingArticles: number;
    openReports: number;
    activeDebates: number;
    discussions: number;
  };
  /** Last 12 weeks, oldest first. */
  weekly: { weekStart: ISODate; signups: number; articles: number; arguments: number }[];
  topCategories: { slug: string; articles: number }[];
  topUniversities: { name: string; members: number }[];
}

// ───────────────────────────── Shared ────────────────────────────

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
