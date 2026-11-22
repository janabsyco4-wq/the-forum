import { route, readJson, clientIp } from "@/server/http/route";
import { forgotPasswordSchema } from "@/server/validation/schemas";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { forgotPassword } from "@/server/services/account";

/** POST /api/auth/forgot-password { email } → { sent: true }. Same answer whether or not the account exists. */
export const POST = route(async (req) => {
  await rateLimit(LIMITS.forgotIp, clientIp(req));
  const { email } = await readJson(req, forgotPasswordSchema, 2_000);
  await rateLimit(LIMITS.codeSend, `email:${email}`);
  return forgotPassword(email);
});
