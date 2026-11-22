import { route, readJson } from "@/server/http/route";
import { debateSchema } from "@/server/validation/schemas";
import { requireRole } from "@/server/auth";
import { createDebate } from "@/server/services/debates";

/** POST /api/debates → Debate (moderator/admin). */
export const POST = route(async (req) => {
  const me = await requireRole("moderator");
  return createDebate(me, await readJson(req, debateSchema, 200_000));
});
