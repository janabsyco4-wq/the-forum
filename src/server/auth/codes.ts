/**
 * One-time 6-digit email codes for email verification and password reset.
 *
 * - Only an HMAC of the code is stored (keyed with SESSION_SECRET).
 * - A new code replaces any earlier one for the same user + purpose.
 * - Codes expire after 15 minutes (TTL index) and die after 5 wrong attempts.
 * - A new code can be requested at most once a minute.
 */
import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { ObjectId } from "mongodb";
import { cols, type EmailCodePurpose, type UserDoc } from "../db";
import { sessionSecret } from "../env";
import { ApiError, invalid } from "../http/errors";
import { sendCodeEmail, type Delivery } from "../mail";

export const CODE_TTL_MIN = 15;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SEC = 60;

const hmac = (userId: ObjectId, purpose: EmailCodePurpose, code: string) =>
  createHmac("sha256", sessionSecret()).update(`${purpose}:${userId.toHexString()}:${code}`).digest("hex");

/** Creates a fresh code and emails it. Throws RATE_LIMITED if the previous one is under a minute old. */
export async function issueCode(user: UserDoc, purpose: EmailCodePurpose): Promise<Delivery> {
  const { emailCodes } = await cols();
  const recent = await emailCodes.findOne({ userId: user._id, purpose }, { sort: { createdAt: -1 } });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_SEC * 1000) {
    const wait = Math.ceil(RESEND_COOLDOWN_SEC - (Date.now() - recent.createdAt.getTime()) / 1000);
    throw new ApiError("RATE_LIMITED", `Please wait ${wait} seconds before asking for another code.`, undefined, { "Retry-After": String(wait) });
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  await emailCodes.deleteMany({ userId: user._id, purpose });
  await emailCodes.insertOne({
    _id: new ObjectId(),
    userId: user._id,
    purpose,
    codeHash: hmac(user._id, purpose, code),
    attempts: 0,
    createdAt: now,
    expiresAt: new Date(now.getTime() + CODE_TTL_MIN * 60_000),
  });
  try {
    return await sendCodeEmail(user.email, { name: user.name, code, locale: user.preferredLocale, minutes: CODE_TTL_MIN, purpose });
  } catch (e) {
    // Don't leave a code nobody received blocking the cooldown.
    await emailCodes.deleteMany({ userId: user._id, purpose });
    throw e;
  }
}

/** Checks a code; consumes it on success. Wrong codes count towards the attempt limit. */
export async function consumeCode(userId: ObjectId, purpose: EmailCodePurpose, code: string): Promise<void> {
  const { emailCodes } = await cols();
  const doc = await emailCodes.findOne({ userId, purpose }, { sort: { createdAt: -1 } });
  const bad = () => invalid("That code is wrong or has expired. Ask for a new one.", { code: "Invalid or expired" });
  if (!doc || doc.expiresAt < new Date() || doc.attempts >= MAX_ATTEMPTS) throw bad();
  const expected = Buffer.from(doc.codeHash, "hex");
  const given = Buffer.from(hmac(userId, purpose, code), "hex");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    const after = await emailCodes.findOneAndUpdate({ _id: doc._id }, { $inc: { attempts: 1 } }, { returnDocument: "after" });
    if (after && after.attempts >= MAX_ATTEMPTS) await emailCodes.deleteOne({ _id: doc._id });
    throw bad();
  }
  await emailCodes.deleteMany({ userId, purpose });
}

/** "s*****z@gmail.com" — for telling the user where the code went without echoing the full address. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const l = local!.length <= 2 ? local![0] + "*" : `${local![0]}${"*".repeat(Math.min(5, local!.length - 2))}${local![local!.length - 1]}`;
  return `${l}@${domain}`;
}
