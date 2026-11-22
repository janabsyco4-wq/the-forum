import { route } from "@/server/http/route";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { toggleLike } from "@/server/services/articles";

/** POST /api/articles/:id/like → { likes, liked } (toggles). */
export const POST = route<{ id: string }>(async (_req, { params }) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  return toggleLike(me, params.id);
});
