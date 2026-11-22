import { route, readJson } from "@/server/http/route";
import { profileSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { updateProfile } from "@/server/services/users";

/** PATCH /api/users/me → PrivateUser */
export const PATCH = route(async (req) => {
  const me = await requireUser({ allowUnverified: true }); // profile edits are fine before email confirmation
  await rateLimit(LIMITS.write, me._id.toString());
  return updateProfile(me, await readJson(req, profileSchema, 20_000));
});
