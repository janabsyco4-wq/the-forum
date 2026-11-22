/**
 * SHARED CONTRACT — the write-side HTTP API.
 *
 * The backend session implements these as Route Handlers under src/app/api/.
 * The frontend calls them through src/lib/api/client.ts. Until an endpoint
 * exists, the frontend shows a clear "Prototype — not saved" notice instead of
 * pretending the action succeeded.
 *
 * Every response uses the envelope below. Auth is an httpOnly, Secure,
 * SameSite=Lax session cookie set by /api/auth/login and /api/auth/register.
 */
import type {
  Article,
  ArticleType,
  Comment,
  CommentTarget,
  Debate,
  DebateArgument,
  DebateConclusion,
  ArgumentKind,
  DebateSide,
  Discussion,
  DiscussionTopic,
  Locale,
  PrivateUser,
  Report,
  ReportReason,
  ReportStatus,
  ReportTarget,
  User,
  UserRole,
  UserStatus,
  ArticleStatus,
} from "@/types/domain";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "EMAIL_UNVERIFIED" // signed in, but must confirm their email (POST /api/auth/verify-email) before writing (added 2026-11-22)
  | "NOT_IMPLEMENTED"
  | "SERVER_ERROR";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ApiErrorCode; message: string; fields?: Record<string, string> } };

// ── Auth ──
export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string; // min 10 chars
  university?: string;
  preferredLocale: Locale;
}
export interface LoginInput {
  email: string;
  password: string;
}

/** "dev-console" = SMTP is not configured; the code was printed in the server log (development only). */
export type EmailDelivery = "email" | "dev-console";
/** Values of ?error= on /{lang}/login after a failed Google sign-in. */
export type GoogleAuthError = "google_unavailable" | "google_cancelled" | "google_failed" | "google_unverified_email" | "suspended";

// ── Articles ──
export interface ArticleInput {
  title: string;
  subtitle?: string;
  excerpt?: string;
  body: string; // HTML from editor — backend MUST sanitise
  type: ArticleType;
  category: string;
  tags: string[];
  language: Locale;
  coverImage?: string;
  coverAlt?: string;
}

// ── Debates ──
export interface DebateInput {
  title: string;
  question: string;
  context: string;
  category: string;
  language: Locale;
  opensAt: string;
  closesAt: string;
  sides: { for: string; against: string };
  readings: { title: string; url: string }[];
  coverImage?: string;
}
export interface ArgumentInput {
  kind: ArgumentKind;
  side: DebateSide;
  parentId?: string;
  title?: string;
  body: string;
}

// ── Discussions & comments ──
export interface DiscussionInput {
  title: string;
  body: string;
  topic: DiscussionTopic;
  language: Locale;
}
export interface CommentInput {
  targetType: CommentTarget;
  targetId: string;
  parentId?: string;
  body: string;
}

// ── Moderation ──
export interface ReportInput {
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

/**
 * Endpoint map: METHOD path → [request body, response data].
 * `:id` segments are Mongo ids; `:slug` are slugs.
 */
export interface ApiEndpoints {
  "POST /api/auth/register": [RegisterInput, PrivateUser];
  "POST /api/auth/login": [LoginInput, PrivateUser];
  "POST /api/auth/logout": [undefined, null];
  "GET /api/auth/me": [undefined, PrivateUser | null];
  // ── Email verification, password reset, providers (added by backend 2026-11-22) ──
  // Register/login still return PrivateUser; when `emailVerified` is false a 6-digit code has been
  // emailed and writes answer EMAIL_UNVERIFIED until the user posts it here.
  "POST /api/auth/verify-email": [{ code: string }, PrivateUser];
  "POST /api/auth/resend-verification": [undefined, { sentTo: string; delivery: EmailDelivery }];
  "POST /api/auth/forgot-password": [{ email: string }, { sent: true; delivery?: EmailDelivery }]; // same answer whether or not the email exists
  "POST /api/auth/reset-password": [{ email: string; code: string; password: string }, PrivateUser]; // signs in, revokes other sessions
  "GET /api/auth/providers": [undefined, { google: boolean; emailDelivery: boolean; uploads: "local" | "cloudinary" | "misconfigured" }]; // uploads added 2026-11-22
  // Google sign-in is a full-page navigation, not an api() call:
  //   <a href="/api/auth/google?next=/en/dashboard&lang=en">Continue with Google</a>
  // On success it redirects to `next`; on failure to /{lang}/login?error=<GoogleAuthError>.

  "PATCH /api/users/me": [Partial<Pick<User, "name" | "headline" | "bio" | "university" | "city" | "country" | "website" | "avatarUrl" | "interests">>, PrivateUser];

  "POST /api/articles": [ArticleInput, Article]; // creates a draft
  "PATCH /api/articles/:id": [Partial<ArticleInput>, Article]; // author only
  "POST /api/articles/:id/submit": [undefined, Article]; // draft -> pending (or published for trusted writers)
  "DELETE /api/articles/:id": [undefined, null];
  "POST /api/articles/:id/like": [undefined, { likes: number; liked: boolean }];
  "POST /api/articles/:id/bookmark": [undefined, { bookmarks: number; bookmarked: boolean }]; // toggles (added by backend 2026-11-14)

  "POST /api/comments": [CommentInput, Comment];

  "POST /api/debates": [DebateInput, Debate]; // admin/moderator
  "PATCH /api/debates/:id": [Partial<DebateInput>, Debate];
  "POST /api/debates/:id/arguments": [ArgumentInput, DebateArgument]; // rejected after closesAt
  "POST /api/debates/:id/conclusion": [Omit<DebateConclusion, "authorId" | "publishedAt">, Debate];
  "POST /api/arguments/:id/vote": [{ value: 1 | -1 }, { votes: number }];

  "POST /api/discussions": [DiscussionInput, Discussion];

  "POST /api/reports": [ReportInput, Report];

  "PATCH /api/admin/users/:id": [{ role?: UserRole; status?: UserStatus }, User];
  "PATCH /api/admin/articles/:id": [{ status?: ArticleStatus; featured?: boolean; editorsPick?: boolean; moderationNote?: string }, Article];
  "PATCH /api/admin/reports/:id": [{ status: ReportStatus; resolution?: string }, Report];
  "PATCH /api/admin/content/:type/:id": [{ status: "visible" | "hidden" | "removed" }, null]; // comments, arguments, discussions

  "POST /api/uploads": [FormData, { url: string }]; // images, max 5 MB

  // ── Social & newsletter (added by frontend 2026-11-22, implemented by backend) ──
  "POST /api/users/:id/follow": [undefined, { followers: number; following: boolean }]; // toggles; can't follow yourself
  "POST /api/newsletter": [{ email: string }, { subscribed: true }]; // anyone; idempotent
}
