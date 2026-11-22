import "server-only";
import { getDb } from "./client";
import { collections, type Collections } from "./collections";

export { getDb, closeDb } from "./client";
export * from "./collections";
export * from "./mappers";

/** Typed collections for the app database. */
export async function cols(): Promise<Collections> {
  return collections(await getDb());
}
