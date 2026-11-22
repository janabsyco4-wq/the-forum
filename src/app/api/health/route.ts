import { route } from "@/server/http/route";
import { getDb } from "@/server/db";

/** GET /api/health → { db: "ok", database, latencyMs }. Confirms the Atlas connection. */
export const GET = route(async () => {
  const t = Date.now();
  const db = await getDb();
  await db.command({ ping: 1 });
  return { db: "ok", database: db.databaseName, latencyMs: Date.now() - t };
});
