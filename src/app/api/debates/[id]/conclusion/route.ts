import { route, readJson } from "@/server/http/route";
import { conclusionSchema } from "@/server/validation/schemas";
import { requireRole } from "@/server/auth";
import { concludeDebate } from "@/server/services/debates";

/** POST /api/debates/:id/conclusion → Debate (moderator/admin, only after closesAt). */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const me = await requireRole("moderator");
  return concludeDebate(me, params.id, await readJson(req, conclusionSchema, 200_000));
});
