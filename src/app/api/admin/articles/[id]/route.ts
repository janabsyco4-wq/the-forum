import { route, readJson } from "@/server/http/route";
import { adminArticleSchema } from "@/server/validation/schemas";
import { requireRole } from "@/server/auth";
import { moderateArticle } from "@/server/services/articles";

/** PATCH /api/admin/articles/:id → Article (moderator/admin). */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireRole("moderator");
  return moderateArticle(params.id, await readJson(req, adminArticleSchema, 5_000));
});
