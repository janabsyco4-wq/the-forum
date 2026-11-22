import { route, readJson, clientIp } from "@/server/http/route";
import { newsletterSchema } from "@/server/validation/schemas";
import { getCurrentUserDoc } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { subscribeNewsletter } from "@/server/services/social";

/** POST /api/newsletter { email, locale? } → { subscribed: true }. Anyone; idempotent; 10 per hour per IP. */
export const POST = route(async (req) => {
  await rateLimit(LIMITS.newsletterIp, clientIp(req));
  const { email, locale } = await readJson(req, newsletterSchema, 2_000);
  const me = await getCurrentUserDoc().catch(() => null);
  return subscribeNewsletter(email, { locale, userId: me?._id });
});
