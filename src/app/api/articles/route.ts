import { route, readJson } from "@/server/http/route";
import { articleSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { createArticle } from "@/server/services/articles";

/** POST /api/articles → Article (always a draft). */
export const POST = route(async (req) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  return createArticle(me, await readJson(req, articleSchema, 400_000));
});
