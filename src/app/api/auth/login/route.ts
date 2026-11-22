import { route, readJson, clientIp } from "@/server/http/route";
import { loginSchema } from "@/server/validation/schemas";
import { LIMITS, rateLimit, resetRateLimit } from "@/server/security/rate-limit";
import { authenticate } from "@/server/services/users";
import { createSession } from "@/server/auth";
import { toPrivateUser } from "@/server/db";

/** POST /api/auth/login → PrivateUser. Rate limited per IP and per account. */
export const POST = route(async (req) => {
  const ip = clientIp(req);
  await rateLimit(LIMITS.loginIp, ip);
  const input = await readJson(req, loginSchema, 10_000);
  await rateLimit(LIMITS.loginAccount, input.email);
  const user = await authenticate(input.email, input.password);
  await resetRateLimit(LIMITS.loginAccount, input.email);
  await createSession(user._id, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
  return toPrivateUser(user);
});
