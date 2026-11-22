import { route } from "@/server/http/route";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { resendVerification } from "@/server/services/account";

/** POST /api/auth/resend-verification → { sentTo: "a****e@gmail.com", delivery }. Max one per minute. */
export const POST = route(async () => {
  const me = await requireUser({ allowUnverified: true });
  await rateLimit(LIMITS.codeSend, `user:${me._id}`);
  return resendVerification(me);
});
