import { route, readJson } from "@/server/http/route";
import { reportSchema } from "@/server/validation/schemas";
import { requireUser } from "@/server/auth";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { createReport } from "@/server/services/community";

/** POST /api/reports → Report */
export const POST = route(async (req) => {
  const me = await requireUser();
  await rateLimit(LIMITS.report, me._id.toString());
  return createReport(me, await readJson(req, reportSchema, 10_000));
});
