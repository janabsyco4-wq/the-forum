/** Email verification, password reset and Google sign-in account resolution. */
import "server-only";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import type { Locale, PrivateUser } from "@/types/domain";
import { cols, toPrivateUser, type UserDoc } from "../db";
import { hashPassword, revokeAllSessions } from "../auth";
import { consumeCode, issueCode, maskEmail } from "../auth/codes";
import type { Delivery } from "../mail";
import { forbidden, invalid } from "../http/errors";
import { sanitizePlainText } from "../security/sanitize";
import { RESERVED_USERNAMES } from "./users";

/** Sends the first verification code after registration. Never fails the registration itself. */
export async function sendVerificationAfterRegister(user: UserDoc): Promise<Delivery | "failed"> {
  try {
    return await issueCode(user, "verify");
  } catch (e) {
    console.error("[auth] could not send verification code after register:", e instanceof Error ? e.message : e);
    return "failed";
  }
}

export async function resendVerification(me: UserDoc): Promise<{ sentTo: string; delivery: Delivery }> {
  if (me.emailVerified) throw invalid("Your email is already confirmed.");
  const delivery = await issueCode(me, "verify");
  return { sentTo: maskEmail(me.email), delivery };
}

export async function verifyEmail(me: UserDoc, code: string): Promise<PrivateUser> {
  if (me.emailVerified) return toPrivateUser(me);
  await consumeCode(me._id, "verify", code);
  const { users } = await cols();
  const updated = await users.findOneAndUpdate(
    { _id: me._id },
    { $set: { emailVerified: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return toPrivateUser(updated!);
}

/** Always resolves the same way whether or not the account exists (no account enumeration). */
export async function forgotPassword(email: string): Promise<{ sent: true; delivery?: Delivery }> {
  const { users } = await cols();
  const user = await users.findOne({ email });
  if (!user || user.status === "suspended") return { sent: true };
  try {
    const delivery = await issueCode(user, "reset");
    // Only reveal the dev-console fallback (never in production, where it cannot happen).
    return delivery === "dev-console" ? { sent: true, delivery } : { sent: true };
  } catch (e) {
    if (e instanceof Error && e.name === "ApiError") return { sent: true }; // cooldown: same answer
    throw e;
  }
}

export async function resetPassword(email: string, code: string, password: string): Promise<UserDoc> {
  const { users } = await cols();
  const user = await users.findOne({ email });
  if (!user) throw invalid("That code is wrong or has expired. Ask for a new one.", { code: "Invalid or expired" });
  await consumeCode(user._id, "reset", code);
  if (user.status === "suspended") throw forbidden("This account is suspended. Contact the moderators.");
  await revokeAllSessions(user._id); // sign out everywhere; the caller creates a fresh session
  const updated = await users.findOneAndUpdate(
    { _id: user._id },
    // Receiving the code proves ownership of the address, so it also counts as verification.
    { $set: { passwordHash: await hashPassword(password), emailVerified: true, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return updated!;
}

// ── Google ──

export interface GoogleProfile {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

async function uniqueUsername(seed: string): Promise<string> {
  const base =
    seed
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "")
      .slice(0, 24) || "member";
  const { users } = await cols();
  const candidates = [base, ...Array.from({ length: 6 }, () => `${base}-${randomBytes(2).toString("hex")}`)];
  for (const c of candidates) {
    if (c.length < 3 || RESERVED_USERNAMES.has(c)) continue;
    if (!(await users.findOne({ usernameLower: c }, { projection: { _id: 1 } }))) return c;
  }
  return `member-${randomBytes(4).toString("hex")}`;
}

/**
 * Finds or creates the FORUM account for a Google identity:
 *  1. an account already linked to this Google `sub`;
 *  2. otherwise an account with the same (Google-verified) email — it gets linked
 *     and marked verified;
 *  3. otherwise a new member account (no password; they can set one via reset).
 */
export async function upsertGoogleUser(p: GoogleProfile, locale: Locale): Promise<UserDoc> {
  if (!p.emailVerified) throw forbidden("google_unverified_email");
  const email = p.email.trim().toLowerCase();
  const { users } = await cols();
  const now = new Date();

  let user = await users.findOne({ googleId: p.sub });
  if (!user) {
    const byEmail = await users.findOne({ email });
    if (byEmail) {
      user = await users.findOneAndUpdate(
        { _id: byEmail._id },
        {
          $set: {
            googleId: p.sub,
            emailVerified: true,
            updatedAt: now,
            ...(!byEmail.avatarUrl && p.picture?.startsWith("https://") ? { avatarUrl: p.picture } : {}),
          },
        },
        { returnDocument: "after" },
      );
    }
  }
  if (!user) {
    const doc: UserDoc = {
      _id: new ObjectId(),
      username: await uniqueUsername(email.split("@")[0]!),
      usernameLower: "",
      name: sanitizePlainText(p.name || email.split("@")[0]!).slice(0, 80) || "Member",
      email,
      emailVerified: true,
      googleId: p.sub,
      preferredLocale: locale,
      ...(p.picture?.startsWith("https://") ? { avatarUrl: p.picture } : {}),
      role: "member",
      status: "active",
      badges: [],
      interests: [],
      joinedAt: now,
      updatedAt: now,
      stats: { articles: 0, arguments: 0, discussions: 0, followers: 0, following: 0 },
    };
    doc.usernameLower = doc.username.toLowerCase();
    await users.insertOne(doc);
    user = doc;
  }
  if (user!.status === "suspended") throw forbidden("suspended");
  return user!;
}
