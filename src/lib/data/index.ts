import "server-only";
import type { DataSource } from "./contract";
import { mockSource } from "./mock";

/**
 * The single entry point pages use to read data.
 *
 * DATA_SOURCE=mock (default) → realistic sample content, nothing persisted.
 * DATA_SOURCE=mongo          → MongoDB Atlas (implemented by the backend in
 *                              src/server/data/mongo-source.ts).
 *
 * BACKEND: when mongo-source.ts exists, replace the body below with:
 *   if (process.env.DATA_SOURCE === "mongo") {
 *     const { mongoSource } = await import("@/server/data/mongo-source");
 *     return mongoSource;
 *   }
 *   return mockSource;
 */
export async function getData(): Promise<DataSource> {
  if (process.env.DATA_SOURCE === "mongo") {
    const { mongoSource } = await import("@/server/data/mongo-source");
    return mongoSource;
  }
  return mockSource;
}

/** True while pages are rendering sample content rather than the database. */
export const isPrototypeData = (process.env.DATA_SOURCE ?? "mock") !== "mongo";

export type { DataSource } from "./contract";
