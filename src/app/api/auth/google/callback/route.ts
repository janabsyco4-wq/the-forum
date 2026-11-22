import { NextResponse, type NextRequest } from "next/server";
import { cookieSecure, googleConfig, isDbConfigured } from "@/server/env";
import { OAUTH_COOKIE, OAUTH_COOKIE_PATH, exchangeCode, readOAuthCookie, stateMatches } from "@/server/auth/google";
import { createSession } from "@/server/auth";
import { upsertGoogleUser } from "@/server/services/account";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { clientIp } from "@/server/http/route";
import type { GoogleAuthError } from "@/lib/api/contract";

/** GET /api/auth/google/callback — Google redirects here; we sign the user in and send them on. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const st = readOAuthCookie(req.cookies.get(OAUTH_COOKIE)?.value);
  const lang = st?.lang ?? "en";

  const finish = (to: string) => {
    const res = NextResponse.redirect(new URL(to, origin));
    res.cookies.set(OAUTH_COOKIE, "", { httpOnly: true, secure: cookieSecure(), sameSite: "lax", path: OAUTH_COOKIE_PATH, maxAge: 0 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  };
  const fail = (code: GoogleAuthError) => finish(`/${lang}/login?error=${code}`);

  if (!googleConfig().configured || !isDbConfigured()) return fail("google_unavailable");
  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail("google_cancelled"); // user pressed Cancel on Google's screen
  if (!st || !stateMatches(st.state, params.get("state")) || !params.get("code")) return fail("google_failed");

  try {
    await rateLimit(LIMITS.oauthIp, clientIp(req));
    const profile = await exchangeCode(params.get("code")!, st, origin);
    const user = await upsertGoogleUser(profile, lang);
    await createSession(user._id, { ip: clientIp(req), userAgent: req.headers.get("user-agent") ?? undefined });
    return finish(st.next);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "google_unverified_email") return fail("google_unverified_email");
    if (msg === "suspended") return fail("suspended");
    console.error("[auth] Google sign-in failed:", msg);
    return fail("google_failed");
  }
}
