/**
 * Route Handler plumbing: every API response goes through `route()` so it
 * always returns the ApiResult envelope from src/lib/api/contract.ts, with a
 * matching HTTP status, `Cache-Control: no-store`, and no stack traces leaked.
 */
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { MongoServerError } from "mongodb";
import { z, ZodError } from "zod";
import type { ApiResult } from "@/lib/api/contract";
import { ConfigError, isDbConfigured } from "../env";
import { ApiError, STATUS, forbidden, invalid } from "./errors";

type Ctx<P> = { params: Promise<P> };
type Handler<P, T> = (req: NextRequest, ctx: { params: P }) => Promise<T>;

const NO_STORE = { "Cache-Control": "no-store" };

export function ok<T>(data: T, init?: { status?: number; headers?: Record<string, string> }) {
  const body: ApiResult<T> = { ok: true, data };
  return NextResponse.json(body, { status: init?.status ?? 200, headers: { ...NO_STORE, ...init?.headers } });
}

export function fail(err: ApiError) {
  const body: ApiResult<never> = {
    ok: false,
    error: { code: err.code, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
  };
  return NextResponse.json(body, { status: STATUS[err.code], headers: { ...NO_STORE, ...err.headers } });
}

export function zodFields(e: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of e.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  if (e instanceof ZodError) return invalid("Some fields are invalid.", zodFields(e));
  if (e instanceof ConfigError) {
    console.error("[api] config:", e.message);
    // 501 → the frontend client shows "Prototype — not saved", which is the truth.
    // ConfigError messages name the missing/invalid setting only — never a secret value.
    return new ApiError("NOT_IMPLEMENTED", `The backend is not configured yet: ${e.message} Nothing was saved.`);
  }
  if (e instanceof Error && /^Mongo(ServerSelection|Network|NetworkTimeout)Error$/.test(e.name)) {
    console.error("[api] database unreachable:", e.message);
    return new ApiError("SERVER_ERROR", "The database is unreachable right now. Nothing was saved — please try again shortly.");
  }
  if (e instanceof MongoServerError && e.code === 11000) {
    const key = Object.keys(e.keyPattern ?? {})[0] ?? "value";
    const field = key === "usernameLower" ? "username" : key;
    return new ApiError("CONFLICT", `That ${field} is already taken.`, { [field]: "Already taken" });
  }
  console.error("[api] unexpected error:", e);
  return new ApiError("SERVER_ERROR", "Something went wrong on our side. Please try again.");
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF defence in depth (cookies are already SameSite=Lax): a state-changing
 * request that carries an Origin header must come from our own host.
 */
function checkOrigin(req: NextRequest) {
  if (!UNSAFE.has(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (curl, server-to-server) send none
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw forbidden("Bad origin.");
  }
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((o) => {
      try {
        return new URL(o).host;
      } catch {
        return o;
      }
    });
  if (originHost !== host && !allowed.includes(originHost)) throw forbidden("Cross-site request blocked.");
}

export function route<P = Record<string, never>, T = unknown>(handler: Handler<P, T>) {
  return async (req: NextRequest, ctx: Ctx<P>): Promise<Response> => {
    try {
      checkOrigin(req);
      if (!isDbConfigured()) throw new ConfigError("MONGODB_URI missing");
      const params = ((await ctx?.params) ?? {}) as P;
      const result = await handler(req, { params });
      if (result instanceof Response) return result;
      return ok(result);
    } catch (e) {
      return fail(toApiError(e));
    }
  };
}

/** Parses and validates a JSON body. Rejects non-JSON and bodies over `maxBytes`. */
export async function readJson<S extends z.ZodType>(req: NextRequest, schema: S, maxBytes = 200_000): Promise<z.infer<S>> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw invalid("Request body is too large.");
  const text = await req.text();
  if (text.length > maxBytes) throw invalid("Request body is too large.");
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    throw invalid("Request body must be valid JSON.");
  }
  return schema.parse(raw);
}

export function clientIp(req: NextRequest): string {
  // Only trustworthy behind a proxy that overwrites these headers (Vercel, Nginx, Cloudflare).
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
