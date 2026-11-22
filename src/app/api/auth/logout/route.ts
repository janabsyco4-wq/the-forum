import { route } from "@/server/http/route";
import { destroySession } from "@/server/auth";

/** POST /api/auth/logout → null. Deletes the server-side session and clears the cookie. */
export const POST = route(async () => {
  await destroySession();
  return null;
});
