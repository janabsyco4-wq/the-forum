/**
 * Fixed-window rate limiter stored in MongoDB (collection `rate_limits`, TTL-
 * expired). It works across serverless instances, unlike an in-memory map.
 * Keys are HMAC'd so raw IPs/emails are never stored.
 *
 * For high traffic, swap this for Redis/Upstash; the call sites only use
 * `rateLimit()`.
 */
import "server-only";
import { createHmac } from "node:crypto";
import { cols } from "../db";
import { sessionSecret } from "../env";
import { ApiError } from "../http/errors";

export interface Limit {
  /** Bucket name, e.g. "login:ip". */
  name: string;
  max: number;
  windowSec: number;
}

export const LIMITS = {
  loginIp: { name: "login:ip", max: 20, windowSec: 15 * 60 },
  loginAccount: { name: "login:acct", max: 8, windowSec: 15 * 60 },
  registerIp: { name: "register:ip", max: 5, windowSec: 60 * 60 },
  write: { name: "write:user", max: 60, windowSec: 60 },
  report: { name: "report:user", max: 20, windowSec: 60 * 60 },
  upload: { name: "upload:user", max: 30, windowSec: 60 * 60 },
  codeSend: { name: "code:send", max: 6, windowSec: 60 * 60 }, // per user/email: verification + reset emails
  codeCheck: { name: "code:check", max: 10, windowSec: 15 * 60 }, // per user/email: guesses
  forgotIp: { name: "forgot:ip", max: 10, windowSec: 60 * 60 },
  oauthIp: { name: "oauth:ip", max: 30, windowSec: 60 * 60 },
  newsletterIp: { name: "newsletter:ip", max: 10, windowSec: 60 * 60 },
} satisfies Record<string, Limit>;

function bucketId(limit: Limit, subject: string, windowStart: number) {
  const h = createHmac("sha256", sessionSecret()).update(`${limit.name}|${subject}`).digest("base64url").slice(0, 32);
  return `${limit.name}:${h}:${windowStart}`;
}

/** Counts one hit; throws RATE_LIMITED (429 + Retry-After) when over the limit. */
export async function rateLimit(limit: Limit, subject: string): Promise<void> {
  const now = Date.now();
  const windowMs = limit.windowSec * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const { rateLimits } = await cols();
  const doc = await rateLimits.findOneAndUpdate(
    { _id: bucketId(limit, subject, windowStart) },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
    { upsert: true, returnDocument: "after" },
  );
  if (doc && doc.count > limit.max) {
    const retry = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
    throw new ApiError("RATE_LIMITED", "Too many attempts. Please wait a little and try again.", undefined, {
      "Retry-After": String(retry),
    });
  }
}

/** Clears a bucket (e.g. the per-account login counter after a successful login). */
export async function resetRateLimit(limit: Limit, subject: string): Promise<void> {
  const windowMs = limit.windowSec * 1000;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const { rateLimits } = await cols();
  await rateLimits.deleteOne({ _id: bucketId(limit, subject, windowStart) });
}
