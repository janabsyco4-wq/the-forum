import { route, readJson } from "@/server/http/route";
import { argumentSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { submitArgument } from "@/server/services/debates";

/** POST /api/debates/:id/arguments → DebateArgument (rejected outside opensAt..closesAt). */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  return submitArgument(me, params.id, await readJson(req, argumentSchema, 40_000));
});
