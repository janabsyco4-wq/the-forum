import { route } from "@/server/http/route";
import { getCurrentUser } from "@/server/auth";

/** GET /api/auth/me → PrivateUser | null */
export const GET = route(async () => getCurrentUser());
