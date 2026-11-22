import { route, readJson } from "@/server/http/route";
import { adminContentSchema } from "@/server/validation/schemas";
import { requireRole } from "@/server/auth";
import { setContentStatus } from "@/server/services/community";

/** PATCH /api/admin/content/:type/:id { status } → null. type: comment | argument | discussion. */
export const PATCH = route<{ type: string; id: string }>(async (req, { params }) => {
  await requireRole("moderator");
  const { status } = await readJson(req, adminContentSchema, 1_000);
  return setContentStatus(params.type, params.id, status);
});
