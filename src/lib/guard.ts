import "server-only";
import { redirect } from "next/navigation";
import type { Locale, PrivateUser } from "@/types/domain";
import { href } from "@/i18n/config";
import { getData, isPrototypeData } from "@/lib/data";

/** Only allow same-site relative paths as a post-login destination (no open redirects). */
export function safeNext(next: string | undefined | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}

/** Where a user lands after signing in, when no `next` was requested. */
export function homeFor(user: Pick<PrivateUser, "role">, locale: Locale) {
  return href(locale, user.role === "admin" || user.role === "moderator" ? "/admin" : "/dashboard");
}

/**
 * Server pages that need an account call this. With a real database, signed-out
 * visitors are sent to the login page and come back to `path` afterwards.
 * In prototype (mock) mode there are no accounts, so it returns null instead.
 */
export async function requireUser(locale: Locale, path: string): Promise<PrivateUser | null> {
  const user = await (await getData()).getCurrentUser();
  if (!user && !isPrototypeData) redirect(`${href(locale, "/login")}?next=${encodeURIComponent(href(locale, path))}`);
  return user;
}

/** Login/register pages: an already signed-in user goes straight to their dashboard. */
export async function redirectIfSignedIn(locale: Locale, next?: string) {
  const user = await (await getData()).getCurrentUser();
  if (user) redirect(safeNext(next) ?? homeFor(user, locale));
}

/**
 * Admin pages call this themselves (Next renders layouts and pages in parallel, so the
 * layout's check alone doesn't stop a page from querying staff-only data first).
 */
export async function requireStaff(locale: Locale, path: string): Promise<PrivateUser | null> {
  const user = await requireUser(locale, path);
  if (!isPrototypeData && user && user.role !== "admin" && user.role !== "moderator") redirect(href(locale, "/dashboard"));
  return user;
}
