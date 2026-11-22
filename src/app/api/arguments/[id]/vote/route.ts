import { route, readJson } from "@/server/http/route";
import { voteSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { voteArgument } from "@/server/services/debates";

/** POST /api/arguments/:id/vote { value: 1 | -1 } → { votes }. Sending the same value again removes the vote. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const me = await requireUser();
  await rateLimit(LIMITS.write, me._id.toString());
  const { value } = await readJson(req, voteSchema, 1_000);
  return voteArgument(me, params.id, value);
});
