import "server-only";
import type { Category, User } from "@/types/domain";
import type { DataSource } from "./contract";

/** Fetch the users referenced by a list of items and return a lookup map. */
export async function userMap(data: DataSource, ids: (string | undefined)[]): Promise<Map<string, User>> {
  const unique = [...new Set(ids.filter(Boolean) as string[])];
  const users = unique.length ? await data.getUsersByIds(unique) : [];
  return new Map(users.map((u) => [u.id, u]));
}

export async function categoryMap(data: DataSource): Promise<Map<string, Category>> {
  const cats = await data.listCategories();
  return new Map(cats.map((c) => [c.slug, c]));
}
