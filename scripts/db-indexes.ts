/** Creates/updates all MongoDB indexes and pings the cluster: `npm run db:indexes`. */
import { closeDb, getDb } from "../src/server/db/client";
import { ensureIndexes } from "../src/server/db/indexes";

async function main() {
  const db = await getDb();
  await db.command({ ping: 1 });
  await ensureIndexes(db);
  const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name).sort();
  console.log(`Connected to "${db.databaseName}". Indexes ensured on: ${names.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
