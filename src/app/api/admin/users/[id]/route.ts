import { route, readJson } from "@/server/http/route";
import { adminUserSchema } from "@/server/validation/schemas";
import { requireRole } from "@/server/auth";
import { adminUpdateUser } from "@/server/services/users";

/** PATCH /api/admin/users/:id { role?, status? } → User. Roles: admin only. Status: moderators too (not on staff accounts). */
export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const actor = await requireRole("moderator");
  return adminUpdateUser(actor, params.id, await readJson(req, adminUserSchema, 1_000));
});
