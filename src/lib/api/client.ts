"use client";

import type { ApiEndpoints, ApiResult } from "./contract";

type Endpoint = keyof ApiEndpoints;
type Body<E extends Endpoint> = ApiEndpoints[E][0];
type Data<E extends Endpoint> = ApiEndpoints[E][1];

/**
 * Typed call to the write API. If the backend has not implemented an endpoint
 * yet (404/501, or the server is unreachable) this resolves to a
 * NOT_IMPLEMENTED error so the UI can say "Prototype — not saved" honestly.
 *
 *   const res = await api("POST /api/comments", { targetType, targetId, body });
 */
export async function api<E extends Endpoint>(
  endpoint: E,
  body?: Body<E>,
  params: Record<string, string> = {},
): Promise<ApiResult<Data<E>>> {
  const [method, rawPath] = (endpoint as string).split(" ");
  const path = rawPath.replace(/:([a-z]+)/g, (_, k: string) => encodeURIComponent(params[k] ?? ""));
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  try {
    const res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
    if (res.status === 404 || res.status === 501) {
      const maybe = await res.json().catch(() => null);
      if (maybe && typeof maybe === "object" && "ok" in maybe && maybe.error?.code !== undefined && res.status === 404 && maybe.error.code === "NOT_FOUND") {
        return maybe as ApiResult<Data<E>>;
      }
      return notImplemented();
    }
    const json = (await res.json().catch(() => null)) as ApiResult<Data<E>> | null;
    if (!json) return { ok: false, error: { code: "SERVER_ERROR", message: `Unexpected response (${res.status})` } };
    // Signed in but email not confirmed yet: every write is refused, so take the user to the code screen
    // and bring them back here afterwards.
    if (!json.ok && json.error.code === "EMAIL_UNVERIFIED" && typeof window !== "undefined" && !location.pathname.includes("/verify-email")) {
      const lang = location.pathname.split("/")[1] === "ur" ? "ur" : "en";
      window.location.assign(`/${lang}/verify-email?next=${encodeURIComponent(location.pathname + location.search)}`);
    }
    return json;
  } catch {
    return notImplemented();
  }
}

function notImplemented<T>(): ApiResult<T> {
  return {
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "This action is not connected to the backend yet. Nothing was saved." },
  };
}
