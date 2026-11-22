/**
 * Current-user access and role guards for Route Handlers and server code.
 *
 *   const me = await requireUser();            // 401 if signed out, 403 if suspended
 *   const mod = await requireRole("moderator"); // moderator OR admin
 *   const admin = await requireRole("admin");
 */
import "server-only";
import { cache } from "react";
import type { PrivateUser, UserRole } from "@/types/domain";
import { cols, toPrivateUser, type UserDoc } from "../db";
import { ApiError, forbidden, unauthenticated } from "../http/errors";
import { readSession } from "./session";

export { createSession, destroySession, revokeAllSessions, SESSION_COOKIE } from "./session";
export { hashPassword, verifyPassword } from "./password";

/** Raw user document for the session (memoised per request/render). Includes private fields — server only. */
export const getCurrentUserDoc = cache(async (): Promise<UserDoc | null> => {
  const userId = await readSession();
  if (!userId) return null;
  const { users } = await cols();
  return users.findOne({ _id: userId });
});

/** The signed-in user as the contract's PrivateUser, or null. */
export async function getCurrentUser(): Promise<PrivateUser | null> {
  const doc = await getCurrentUserDoc();
  return doc ? toPrivateUser(doc) : null;
}

/**
 * Signed-in, not suspended, and (unless `allowUnverified`) with a confirmed
 * email. Unverified users get EMAIL_UNVERIFIED so the UI can show the code form.
 */
export async function requireUser(opts: { allowUnverified?: boolean } = {}): Promise<UserDoc> {
  const doc = await getCurrentUserDoc();
  if (!doc) throw unauthenticated();
  if (doc.status === "suspended") throw forbidden("Your account is suspended.");
  if (!doc.emailVerified && !opts.allowUnverified) {
    throw new ApiError("EMAIL_UNVERIFIED", "Please confirm your email address first — we sent you a 6-digit code.");
  }
  return doc;
}

const RANK: Record<UserRole, number> = { member: 0, writer: 1, ambassador: 1, moderator: 2, admin: 3 };

/** `moderator` admits moderators and admins; `admin` admits admins only. */
export function hasRole(user: Pick<UserDoc, "role"> | null | undefined, role: "moderator" | "admin"): boolean {
  return !!user && RANK[user.role] >= RANK[role];
}

export async function requireRole(role: "moderator" | "admin"): Promise<UserDoc> {
  const user = await requireUser();
  if (!hasRole(user, role)) throw forbidden(role === "admin" ? "Admins only." : "Moderators and admins only.");
  return user;
}

/** Writers, moderators, admins and featured writers publish without review. */
export function isTrustedWriter(user: Pick<UserDoc, "role" | "badges">): boolean {
  return (
    user.role === "writer" ||
    user.role === "moderator" ||
    user.role === "admin" ||
    user.badges?.includes("featured-writer") === true
  );
}
