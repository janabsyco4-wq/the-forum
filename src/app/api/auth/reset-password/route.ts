import { route, readJson, clientIp } from "@/server/http/route";
import { resetPasswordSchema } from "@/server/validation/schemas";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { resetPassword } from "@/server/services/account";
import { createSession } from "@/server/auth";
import { toPrivateUser } from "@/server/db";

/**
 * POST /api/auth/reset-password { email, code, password } → PrivateUser.
 * Sets the new password, signs out every other session, and signs this browser in.
 */
export const POST = route(async (req) => {
  const ip = clientIp(req);
  await rateLimit(LIMITS.forgotIp, ip);
  const { email, code, password } = await readJson(req, resetPasswordSchema, 2_000);
  await rateLimit(LIMITS.codeCheck, `reset:${email}`);
  const user = await resetPassword(email, code, password);
  await createSession(user._id, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
  return toPrivateUser(user);
});
