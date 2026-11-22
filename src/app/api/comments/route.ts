import { route, readJson } from "@/server/http/route";
import { commentSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { createComment } from "@/server/services/community";

/** POST /api/comments → Comment */
export const POST = route(async (req) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  return createComment(me, await readJson(req, commentSchema, 20_000));
});
