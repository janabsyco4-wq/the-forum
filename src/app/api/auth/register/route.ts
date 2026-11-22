import { route, readJson, clientIp } from "@/server/http/route";
import { registerSchema } from "@/server/validation/schemas";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { registerUser } from "@/server/services/users";
import { sendVerificationAfterRegister } from "@/server/services/account";
import { createSession } from "@/server/auth";
import { toPrivateUser } from "@/server/db";

/**
 * POST /api/auth/register → PrivateUser (emailVerified: false) and signs the user in.
 * A 6-digit verification code is emailed; writes answer EMAIL_UNVERIFIED until
 * it is posted to /api/auth/verify-email.
 */
export const POST = route(async (req) => {
  await rateLimit(LIMITS.registerIp, clientIp(req));
  const input = await readJson(req, registerSchema, 10_000);
  const user = await registerUser(input);
  await createSession(user._id, { ip: clientIp(req), userAgent: req.headers.get("user-agent") ?? undefined });
  await sendVerificationAfterRegister(user);
  return toPrivateUser(user);
});
