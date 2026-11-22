import { NextResponse, type NextRequest } from "next/server";
import { googleConfig, cookieSecure } from "@/server/env";
import { OAUTH_COOKIE, OAUTH_COOKIE_PATH, buildAuthRequest, safeNext } from "@/server/auth/google";

/**
 * GET /api/auth/google?next=/en/dashboard&lang=en
 * Full-page navigation (not an api() call). Redirects to Google's consent screen,
 * or back to /{lang}/login?error=google_unavailable when Google is not configured.
 */
export async function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang") === "ur" ? "ur" : "en";
  const origin = req.nextUrl.origin;
  if (!googleConfig().configured || !process.env.SESSION_SECRET) {
    return NextResponse.redirect(new URL(`/${lang}/login?error=google_unavailable`, origin));
  }
  const next = safeNext(req.nextUrl.searchParams.get("next"), lang);
  const { url, cookie } = buildAuthRequest(origin, next, lang);
  const res = NextResponse.redirect(url);
  res.cookies.set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax", // must survive the top-level redirect back from accounts.google.com
    path: OAUTH_COOKIE_PATH,
    maxAge: 600,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
