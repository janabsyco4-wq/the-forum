/**
 * Document → contract mapping. Every value leaving the backend goes through
 * one of these, so ids are strings, dates are ISO strings, and private user
 * fields are never present on a public `User`.
 */
import { ObjectId } from "mongodb";
import type {
  Ambassador,
  Article,
  Category,
  Comment,
  Debate,
  DebateArgument,
  DebateStatus,
  Discussion,
  Initiative,
  PrivateUser,
  Report,
  ResearchItem,
  User,
} from "@/types/domain";
import type {
  AmbassadorDoc,
  ArgumentDoc,
  ArticleDoc,
  CategoryDoc,
  CommentDoc,
  DebateDoc,
  DiscussionDoc,
  InitiativeDoc,
  ReportDoc,
  ResearchDoc,
  UserDoc,
} from "./collections";

/** Parses a 24-hex id; returns null for anything else (never throws). */
export function toObjectId(id: unknown): ObjectId | null {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) return null;
  return new ObjectId(id);
}

const iso = (d: Date) => d.toISOString();
const isoOpt = (d?: Date) => (d ? d.toISOString() : undefined);

/** Drops `undefined` keys so JSON/RSC payloads stay small and tidy. */
function clean<T extends object>(o: T): T {
  for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k];
  return o;
}

export function toUser(d: UserDoc): User {
  return clean({
    id: d._id.toString(),
    username: d.username,
    name: d.name,
    avatarUrl: d.avatarUrl,
    headline: d.headline,
    bio: d.bio,
    university: d.university,
    city: d.city,
    country: d.country,
    website: d.website,
    role: d.role,
    status: d.status,
    badges: d.badges ?? [],
    interests: d.interests ?? [],
    joinedAt: iso(d.joinedAt),
    stats: d.stats,
  });
}

export function toPrivateUser(d: UserDoc): PrivateUser {
  return { ...toUser(d), email: d.email, emailVerified: d.emailVerified, preferredLocale: d.preferredLocale };
}

export function toCategory(d: CategoryDoc): Category {
  return { slug: d._id, name: d.name, description: d.description };
}

export function toArticle(d: ArticleDoc): Article {
  return clean({
    id: d._id.toString(),
    slug: d.slug,
    title: d.title,
    subtitle: d.subtitle,
    excerpt: d.excerpt,
    body: d.body,
    type: d.type,
    category: d.category,
    tags: d.tags,
    language: d.language,
    coverImage: d.coverImage,
    coverAlt: d.coverAlt,
    authorId: d.authorId.toString(),
    status: d.status,
    featured: d.featured,
    editorsPick: d.editorsPick,
    readingMinutes: d.readingMinutes,
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
    publishedAt: isoOpt(d.publishedAt),
    stats: d.stats,
    moderationNote: d.moderationNote,
  });
}

export function toComment(d: CommentDoc): Comment {
  return clean({
    id: d._id.toString(),
    targetType: d.targetType,
    targetId: d.targetId.toString(),
    parentId: d.parentId?.toString(),
    authorId: d.authorId.toString(),
    body: d.body,
    createdAt: iso(d.createdAt),
    likes: d.likes,
    status: d.status,
  });
}

/** Status is derived from the clock so no cron job is needed to open/close debates. */
export function effectiveDebateStatus(d: Pick<DebateDoc, "opensAt" | "closesAt" | "conclusion">, now = new Date()): DebateStatus {
  if (d.conclusion) return "concluded";
  if (now < d.opensAt) return "upcoming";
  if (now < d.closesAt) return "open";
  return "closed";
}

export function toDebate(d: DebateDoc): Debate {
  return clean({
    id: d._id.toString(),
    slug: d.slug,
    title: d.title,
    question: d.question,
    context: d.context,
    category: d.category,
    language: d.language,
    coverImage: d.coverImage,
    weekNumber: d.weekNumber,
    opensAt: iso(d.opensAt),
    closesAt: iso(d.closesAt),
    status: effectiveDebateStatus(d),
    sides: d.sides,
    readings: d.readings ?? [],
    createdBy: d.createdBy.toString(),
    conclusion: d.conclusion
      ? clean({
          summary: d.conclusion.summary,
          body: d.conclusion.body,
          authorId: d.conclusion.authorId.toString(),
          publishedAt: iso(d.conclusion.publishedAt),
          verdict: d.conclusion.verdict,
        })
      : undefined,
    stats: d.stats,
  });
}

export function toArgument(d: ArgumentDoc): DebateArgument {
  return clean({
    id: d._id.toString(),
    debateId: d.debateId.toString(),
    authorId: d.authorId.toString(),
    kind: d.kind,
    side: d.side,
    parentId: d.parentId?.toString(),
    title: d.title,
    body: d.body,
    createdAt: iso(d.createdAt),
    votes: d.votes,
    status: d.status,
    highlighted: d.highlighted,
  });
}

export function toDiscussion(d: DiscussionDoc): Discussion {
  return {
    id: d._id.toString(),
    slug: d.slug,
    title: d.title,
    body: d.body,
    topic: d.topic,
    language: d.language,
    authorId: d.authorId.toString(),
    createdAt: iso(d.createdAt),
    lastActivityAt: iso(d.lastActivityAt),
    pinned: d.pinned,
    locked: d.locked,
    status: d.status,
    stats: d.stats,
  };
}

export function toInitiative(d: InitiativeDoc): Initiative {
  return clean({
    id: d._id.toString(),
    slug: d.slug,
    kind: d.kind,
    title: d.title,
    summary: d.summary,
    body: d.body,
    status: d.status,
    coverImage: d.coverImage,
    city: d.city,
    partner: d.partner,
    organizerId: d.organizerId.toString(),
    startsAt: iso(d.startsAt),
    endsAt: isoOpt(d.endsAt),
    goal: d.goal,
    prize: d.prize,
    participants: d.participants,
    tags: d.tags ?? [],
  });
}

export function toAmbassador(d: AmbassadorDoc): Ambassador {
  return {
    userId: d.userId.toString(),
    university: d.university,
    city: d.city,
    since: iso(d.since),
    chapterSize: d.chapterSize,
  };
}

export function toResearch(d: ResearchDoc): ResearchItem {
  return clean({
    id: d._id.toString(),
    slug: d.slug,
    title: d.title,
    abstract: d.abstract,
    type: d.type,
    field: d.field,
    authorIds: d.authorIds.map((a) => a.toString()),
    supervisor: d.supervisor,
    institution: d.institution,
    publishedAt: iso(d.publishedAt),
    keywords: d.keywords ?? [],
    pdfUrl: d.pdfUrl,
    doi: d.doi,
    stats: d.stats,
    peerReviewed: d.peerReviewed,
  });
}

export function toReport(d: ReportDoc): Report {
  return clean({
    id: d._id.toString(),
    targetType: d.targetType,
    targetId: d.targetId.toString(),
    targetPreview: d.targetPreview,
    reason: d.reason,
    details: d.details,
    reporterId: d.reporterId.toString(),
    createdAt: iso(d.createdAt),
    status: d.status,
    resolvedBy: d.resolvedBy?.toString(),
    resolution: d.resolution,
  });
}
