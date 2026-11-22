import { route, readJson } from "@/server/http/route";
import { adminReportSchema } from "@/server/validation/schemas";
import { requireRole } from "@/server/auth";
import { resolveReport } from "@/server/services/community";

/** PATCH /api/admin/reports/:id { status, resolution? } → Report (moderator/admin). */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const me = await requireRole("moderator");
  const { status, resolution } = await readJson(req, adminReportSchema, 5_000);
  return resolveReport(me, params.id, status, resolution);
});
