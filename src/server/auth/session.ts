/**
 * Server-side sessions.
 *
 * The cookie holds a random 256-bit token; the database stores only its
 * SHA-256 hash (a DB leak does not leak usable sessions). Revocation is a
 * delete: logout removes one session, suspension / password change removes
 * all of a user's sessions, and a TTL index purges expired ones.
 *
 * Cookie: httpOnly, Secure, SameSite=Lax, Path=/, 30-day absolute lifetime.
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { ObjectId } from "mongodb";
import { cols } from "../db";
import { cookieSecure } from "../env";

export const SESSION_COOKIE = "forum_session";
const MAX_AGE_SEC = 30 * 24 * 60 * 60;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: ObjectId, meta: { ip?: string; userAgent?: string } = {}) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAX_AGE_SEC * 1000);
  const { sessions } = await cols();
  await sessions.insertOne({
    _id: hashToken(token),
    userId,
    createdAt: now,
    expiresAt,
    ip: meta.ip,
    userAgent: meta.userAgent?.slice(0, 300),
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Returns the userId for the current request's session cookie, or null. */
export async function readSession(): Promise<ObjectId | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const { sessions } = await cols();
  const s = await sessions.findOne({ _id: hashToken(token) });
  if (!s || s.expiresAt < new Date()) return null;
  return s.userId;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const { sessions } = await cols();
    await sessions.deleteOne({ _id: hashToken(token) });
  }
  jar.set(SESSION_COOKIE, "", { httpOnly: true, secure: cookieSecure(), sameSite: "lax", path: "/", maxAge: 0 });
}

/** Revokes every session a user has (suspension, password reset, "sign out everywhere"). */
export async function revokeAllSessions(userId: ObjectId): Promise<number> {
  const { sessions } = await cols();
  const r = await sessions.deleteMany({ userId });
  return r.deletedCount;
}
