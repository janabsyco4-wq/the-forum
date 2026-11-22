import { route, readJson } from "@/server/http/route";
import { discussionSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { createDiscussion } from "@/server/services/community";

/** POST /api/discussions → Discussion */
export const POST = route(async (req) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  return createDiscussion(me, await readJson(req, discussionSchema, 40_000));
});
