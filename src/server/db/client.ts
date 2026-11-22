/**
 * MongoDB Atlas connection.
 *
 * Why the official `mongodb` driver and not Mongoose:
 *  - The shared contract (src/types/domain.ts) already defines every shape, so
 *    Mongoose schemas would be a second, drifting copy of the same types.
 *    Typed driver collections + zod validation at the API edge give the same
 *    safety with one source of truth.
 *  - No model registry, so no "OverwriteModelError" on Turbopack hot reload and
 *    no per-request schema compilation on cold serverless starts.
 *  - Smaller bundle, fewer abstractions between us and the queries/indexes.
 *
 * The client promise is cached on `globalThis` so dev hot reloads and warm
 * serverless invocations reuse one connection pool instead of opening a new
 * one per module evaluation.
 */
import "server-only";
import { MongoClient, type Db } from "mongodb";
import { mongoDbName, mongoUri } from "../env";
import { ensureIndexes } from "./indexes";

type Cache = { client?: Promise<MongoClient>; indexes?: Promise<void> };

const g = globalThis as typeof globalThis & { __forumMongo?: Cache };
const cache: Cache = (g.__forumMongo ??= {});

function connect(): Promise<MongoClient> {
  if (!cache.client) {
    const client = new MongoClient(mongoUri(), {
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL || 10),
      serverSelectionTimeoutMS: 10_000,
      appName: "the-forum",
    });
    cache.client = client.connect().catch((err) => {
      cache.client = undefined; // allow a retry on the next request
      throw err;
    });
  }
  return cache.client;
}

/** The app database. Indexes are ensured once per process (idempotent). */
export async function getDb(): Promise<Db> {
  const client = await connect();
  const db = client.db(mongoDbName());
  if (!cache.indexes && process.env.MONGODB_SKIP_INDEXES !== "true") {
    cache.indexes = ensureIndexes(db).catch((err) => {
      cache.indexes = undefined;
      console.error("[db] ensureIndexes failed:", err);
    });
  }
  await cache.indexes;
  return db;
}

export async function closeDb(): Promise<void> {
  if (cache.client) {
    const c = await cache.client;
    await c.close();
    cache.client = undefined;
    cache.indexes = undefined;
  }
}
