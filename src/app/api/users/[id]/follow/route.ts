import { route } from "@/server/http/route";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { toggleFollow } from "@/server/services/social";

/** POST /api/users/:id/follow → { followers, following } (toggles). Verified email required; cannot follow yourself. */
export const POST = route<{ id: string }>(async (_req, { params }) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  return toggleFollow(me, params.id);
});
