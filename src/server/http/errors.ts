import type { ApiErrorCode } from "@/lib/api/contract";

export const STATUS: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  EMAIL_UNVERIFIED: 403,
  NOT_IMPLEMENTED: 501,
  SERVER_ERROR: 500,
};

/** Throw from anywhere in a handler/service; the route wrapper turns it into the ApiResult envelope. */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public fields?: Record<string, string>,
    public headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const unauthenticated = (m = "Please sign in to continue.") => new ApiError("UNAUTHENTICATED", m);
export const forbidden = (m = "You do not have permission to do that.") => new ApiError("FORBIDDEN", m);
export const notFound = (m = "Not found.") => new ApiError("NOT_FOUND", m);
export const conflict = (m: string, fields?: Record<string, string>) => new ApiError("CONFLICT", m, fields);
export const invalid = (m: string, fields?: Record<string, string>) => new ApiError("VALIDATION", m, fields);
