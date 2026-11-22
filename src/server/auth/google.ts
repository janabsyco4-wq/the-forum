/**
 * "Continue with Google" — OpenID Connect authorization-code flow with PKCE.
 *
 * Start (GET /api/auth/google): random `state`, `nonce` and PKCE verifier go
 * into a short-lived, HMAC-signed, httpOnly cookie; the browser is sent to Google.
 * Callback (GET /api/auth/google/callback): the state must match the cookie, the
 * code is exchanged server-to-server (with the verifier and client secret), and
 * the ID token is verified with Google's published keys (issuer, audience,
 * expiry, nonce). Only Google-verified emails are accepted.
 */
import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Locale } from "@/types/domain";
import { appUrl, googleConfig, sessionSecret } from "../env";

export const OAUTH_COOKIE = "forum_oauth";
export const OAUTH_COOKIE_PATH = "/api/auth/google";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export interface OAuthState {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
  lang: Locale;
  t: number;
}

const b64 = (b: Buffer) => b.toString("base64url");
const sign = (payload: string) => createHmac("sha256", sessionSecret()).update(`oauth|${payload}`).digest("base64url");

export function redirectUri(origin: string): string {
  return `${appUrl(origin)}/api/auth/google/callback`;
}

/** Only same-site paths are allowed as post-login destinations (no open redirects). */
export function safeNext(next: string | null | undefined, lang: Locale): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") && !next.startsWith("/api/")) return next;
  return `/${lang}`;
}

export function buildAuthRequest(origin: string, next: string, lang: Locale) {
  const { clientId } = googleConfig();
  const st: OAuthState = { state: b64(randomBytes(24)), nonce: b64(randomBytes(24)), verifier: b64(randomBytes(48)), next, lang, t: Date.now() };
  const challenge = b64(createHash("sha256").update(st.verifier).digest());
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state: st.state,
    nonce: st.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  const payload = b64(Buffer.from(JSON.stringify(st)));
  return { url: url.toString(), cookie: `${payload}.${sign(payload)}` };
}

export function readOAuthCookie(value: string | undefined): OAuthState | null {
  if (!value) return null;
  const [payload, mac] = value.split(".");
  if (!payload || !mac) return null;
  const a = Buffer.from(mac);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const st = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as OAuthState;
    if (Date.now() - st.t > 10 * 60_000) return null; // 10-minute window
    return st;
  } catch {
    return null;
  }
}

export function stateMatches(expected: string, got: string | null): boolean {
  if (!got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Exchanges the code and returns the verified identity claims. Throws on any problem. */
export async function exchangeCode(code: string, st: OAuthState, origin: string) {
  const { clientId, clientSecret } = googleConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri(origin),
      grant_type: "authorization_code",
      code_verifier: st.verifier,
    }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string; error_description?: string };
  if (!res.ok || !json.id_token) throw new Error(`Google token exchange failed: ${json.error ?? res.status} ${json.error_description ?? ""}`.trim());

  const { payload } = await jwtVerify(json.id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId!,
  });
  if (payload.nonce !== st.nonce) throw new Error("Google ID token nonce mismatch");
  if (typeof payload.sub !== "string" || typeof payload.email !== "string") throw new Error("Google ID token missing sub/email");
  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
