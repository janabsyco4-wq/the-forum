import { route } from "@/server/http/route";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { submitArticle } from "@/server/services/articles";

/** POST /api/articles/:id/submit → Article (draft → pending, or published for trusted writers). */
export const POST = route<{ id: string }>(async (_req, { params }) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  return submitArticle(me, params.id);
});
