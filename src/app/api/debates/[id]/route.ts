import { route, readJson } from "@/server/http/route";
import { debatePatchSchema } from "@/server/validation/schemas";
import { requireRole } from "@/server/auth";
import { updateDebate } from "@/server/services/debates";

/** PATCH /api/debates/:id → Debate (moderator/admin). */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireRole("moderator");
  return updateDebate(params.id, await readJson(req, debatePatchSchema, 200_000));
});
