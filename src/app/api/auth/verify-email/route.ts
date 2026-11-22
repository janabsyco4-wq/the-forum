import { route, readJson } from "@/server/http/route";
import { verifyEmailSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { verifyEmail } from "@/server/services/account";

/** POST /api/auth/verify-email { code } → PrivateUser with emailVerified: true. */
export const POST = route(async (req) => {
  const me = await requireUser({ allowUnverified: true });
  await rateLimit(LIMITS.codeCheck, `verify:${me._id}`);
  const { code } = await readJson(req, verifyEmailSchema, 1_000);
  return verifyEmail(me, code);
});
