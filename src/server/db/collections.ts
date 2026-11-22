/**
 * Stored document shapes. These mirror the contract types in src/types/domain.ts
 * with Mongo-native representations: `_id`/refs are ObjectIds and dates are
 * `Date`. src/server/db/mappers.ts converts them to the contract (string ids,
 * ISO dates). Private fields (email, passwordHash) live only here.
 */
import type { Db, ObjectId } from "mongodb";
import type {
  ArgumentKind,
  ArticleStatus,
  ArticleType,
  BadgeKey,
  CommentTarget,
  DebateSide,
  DebateStatus,
  DiscussionTopic,
  InitiativeKind,
  InitiativeStatus,
  Locale,
  LocalizedText,
  ReportReason,
  ReportStatus,
  ReportTarget,
  ResearchType,
  UserRole,
  UserStats,
  UserStatus,
} from "@/types/domain";

export type Visibility = "visible" | "hidden" | "removed";

export interface UserDoc {
  _id: ObjectId;
  username: string;
  usernameLower: string; // unique, case-insensitive lookups
  name: string;
  email: string; // lower-cased, unique, PRIVATE
  emailVerified: boolean;
  /** argon2id, PRIVATE. Absent for accounts created with Google until they set a password via reset. */
  passwordHash?: string;
  /** Google account subject (`sub`), PRIVATE. Set when the user signs in with Google. */
  googleId?: string;
  preferredLocale: Locale;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  university?: string;
  city?: string;
  country?: string;
  website?: string;
  role: UserRole;
  status: UserStatus;
  badges: BadgeKey[];
  interests: string[];
  joinedAt: Date;
  updatedAt: Date;
  stats: UserStats;
}

export interface SessionDoc {
  _id: string; // sha256(token) hex — the raw token only ever lives in the cookie
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date; // TTL index removes expired sessions
  ip?: string;
  userAgent?: string;
}

export interface CategoryDoc {
  _id: string; // slug
  name: LocalizedText;
  description: LocalizedText;
  order?: number;
}

export interface ArticleDoc {
  _id: ObjectId;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  body: string; // sanitised HTML
  type: ArticleType;
  category: string;
  tags: string[];
  language: Locale;
  coverImage?: string;
  coverAlt?: string;
  authorId: ObjectId;
  status: ArticleStatus;
  featured: boolean;
  editorsPick: boolean;
  readingMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  stats: { views: number; likes: number; comments: number; bookmarks: number };
  moderationNote?: string;
}

export interface CommentDoc {
  _id: ObjectId;
  targetType: CommentTarget;
  targetId: ObjectId;
  parentId?: ObjectId;
  authorId: ObjectId;
  body: string;
  createdAt: Date;
  likes: number;
  status: Visibility;
}

export interface DebateDoc {
  _id: ObjectId;
  slug: string;
  title: string;
  question: string;
  context: string; // sanitised HTML
  category: string;
  language: Locale;
  coverImage?: string;
  weekNumber: number;
  opensAt: Date;
  closesAt: Date;
  /** Stored hint only; the effective status is derived from dates + conclusion (see mappers). */
  status: DebateStatus;
  sides: { for: string; against: string };
  readings: { title: string; url: string }[];
  createdBy: ObjectId;
  conclusion?: {
    summary: string;
    body: string;
    authorId: ObjectId;
    publishedAt: Date;
    verdict?: DebateSide;
  };
  stats: { arguments: number; participants: number; votesFor: number; votesAgainst: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface ArgumentDoc {
  _id: ObjectId;
  debateId: ObjectId;
  authorId: ObjectId;
  kind: ArgumentKind;
  side: DebateSide;
  parentId?: ObjectId;
  title?: string;
  body: string;
  createdAt: Date;
  votes: number; // net (+1/-1 sum)
  status: Visibility;
  highlighted?: boolean;
}

export interface DiscussionDoc {
  _id: ObjectId;
  slug: string;
  title: string;
  body: string;
  topic: DiscussionTopic;
  language: Locale;
  authorId: ObjectId;
  createdAt: Date;
  lastActivityAt: Date;
  pinned: boolean;
  locked: boolean;
  status: Visibility;
  stats: { replies: number; views: number; participants: number };
}

export interface InitiativeDoc {
  _id: ObjectId;
  slug: string;
  kind: InitiativeKind;
  title: string;
  summary: string;
  body: string;
  status: InitiativeStatus;
  coverImage?: string;
  city?: string;
  partner?: string;
  organizerId: ObjectId;
  startsAt: Date;
  endsAt?: Date;
  goal?: string;
  prize?: string;
  participants: number;
  tags: string[];
}

export interface AmbassadorDoc {
  _id: ObjectId; // == userId (one ambassador record per user)
  userId: ObjectId;
  university: string;
  city: string;
  since: Date;
  chapterSize: number;
}

export interface ResearchDoc {
  _id: ObjectId;
  slug: string;
  title: string;
  abstract: string;
  type: ResearchType;
  field: string;
  authorIds: ObjectId[];
  supervisor?: string;
  institution?: string;
  publishedAt: Date;
  keywords: string[];
  pdfUrl?: string;
  doi?: string;
  stats: { reads: number; citations: number; downloads: number };
  peerReviewed: boolean;
}

export interface ReportDoc {
  _id: ObjectId;
  targetType: ReportTarget;
  targetId: ObjectId;
  targetPreview: string;
  reason: ReportReason;
  details?: string;
  reporterId: ObjectId;
  createdAt: Date;
  status: ReportStatus;
  resolvedBy?: ObjectId;
  resolution?: string;
  resolvedAt?: Date;
}

export type LikeTarget = "article" | "comment";
export interface LikeDoc {
  _id: ObjectId;
  userId: ObjectId;
  targetType: LikeTarget;
  targetId: ObjectId;
  createdAt: Date;
}

export interface VoteDoc {
  _id: ObjectId;
  userId: ObjectId;
  argumentId: ObjectId;
  value: 1 | -1;
  createdAt: Date;
}

export interface BookmarkDoc {
  _id: ObjectId;
  userId: ObjectId;
  articleId: ObjectId;
  createdAt: Date;
}

export interface FollowDoc {
  _id: ObjectId;
  followerId: ObjectId; // who follows
  followeeId: ObjectId; // who is followed
  createdAt: Date;
}

export interface NewsletterDoc {
  _id: ObjectId;
  email: string; // lower-cased, unique
  locale?: Locale;
  userId?: ObjectId; // set when subscribed while signed in
  createdAt: Date;
}

export type EmailCodePurpose = "verify" | "reset";
export interface EmailCodeDoc {
  _id: ObjectId;
  userId: ObjectId;
  purpose: EmailCodePurpose;
  codeHash: string; // HMAC-SHA256 — the code itself is never stored
  attempts: number;
  createdAt: Date;
  expiresAt: Date; // TTL index
}

export interface RateLimitDoc {
  _id: string; // bucket key
  count: number;
  expiresAt: Date;
}

export function collections(db: Db) {
  return {
    users: db.collection<UserDoc>("users"),
    sessions: db.collection<SessionDoc>("sessions"),
    categories: db.collection<CategoryDoc>("categories"),
    articles: db.collection<ArticleDoc>("articles"),
    comments: db.collection<CommentDoc>("comments"),
    debates: db.collection<DebateDoc>("debates"),
    arguments: db.collection<ArgumentDoc>("arguments"),
    discussions: db.collection<DiscussionDoc>("discussions"),
    initiatives: db.collection<InitiativeDoc>("initiatives"),
    ambassadors: db.collection<AmbassadorDoc>("ambassadors"),
    research: db.collection<ResearchDoc>("research"),
    reports: db.collection<ReportDoc>("reports"),
    likes: db.collection<LikeDoc>("likes"),
    votes: db.collection<VoteDoc>("votes"),
    bookmarks: db.collection<BookmarkDoc>("bookmarks"),
    rateLimits: db.collection<RateLimitDoc>("rate_limits"),
    emailCodes: db.collection<EmailCodeDoc>("email_codes"),
    follows: db.collection<FollowDoc>("follows"),
    newsletter: db.collection<NewsletterDoc>("newsletter"),
  };
}

export type Collections = ReturnType<typeof collections>;
