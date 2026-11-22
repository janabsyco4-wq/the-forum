import { route, readJson } from "@/server/http/route";
import { articlePatchSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { deleteArticle, updateArticle } from "@/server/services/articles";

/** PATCH /api/articles/:id → Article (author only). */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  return updateArticle(me, params.id, await readJson(req, articlePatchSchema, 400_000));
});

/** DELETE /api/articles/:id → null (author or admin). */
export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  return deleteArticle(me, params.id);
});
