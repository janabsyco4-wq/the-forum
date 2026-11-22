/**
 * Server-side environment access. Nothing here is ever sent to the client.
 * Values are read lazily so `tsc`, `next dev` and the frontend's mock mode all
 * work without a database configured.
 */

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export function mongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new ConfigError(
      "MONGODB_URI is not set. Put your Atlas connection string in .env.local (see .env.example).",
    );
  }
  return uri;
}

export function mongoDbName(): string {
  return process.env.MONGODB_DB || "the_forum";
}

/** Used to derive the HMAC key for rate-limit buckets and other server secrets. */
export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new ConfigError("SESSION_SECRET must be set to at least 32 random characters (see .env.example).");
  }
  return s;
}

export const isProduction = process.env.NODE_ENV === "production";

/** Secure cookies everywhere by default; browsers accept Secure cookies on http://localhost. */
export function cookieSecure(): boolean {
  return process.env.COOKIE_SECURE !== "false";
}

/** Public base URL of the site (used for OAuth redirect URIs and links in emails). */
export function appUrl(fallbackOrigin?: string): string {
  return (process.env.APP_URL || fallbackOrigin || "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * Outgoing email over SMTP. For Gmail: SMTP_USER = the Gmail address,
 * SMTP_PASS = a 16-character App Password (Google Account → Security →
 * 2-Step Verification → App passwords). Spaces in the app password are ignored.
 */
export function mailConfig() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const port = Number(process.env.SMTP_PORT || 465);
  return {
    configured: Boolean(user && pass),
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    user,
    pass,
    from: process.env.MAIL_FROM || (user ? `THE FORUM <${user}>` : "THE FORUM <no-reply@localhost>"),
  };
}

/** Google OAuth 2.0 / OpenID Connect client (Google Cloud Console → APIs & Services → Credentials). */
export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return { configured: Boolean(clientId && clientSecret), clientId, clientSecret };
}

export interface CloudinaryCreds {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Parses CLOUDINARY_URL, exactly as the Cloudinary dashboard shows it under
 * "API environment variable": cloudinary://<api_key>:<api_secret>@<cloud_name>
 * Returns null when unset; throws ConfigError when set but malformed.
 */
export function cloudinaryCreds(): CloudinaryCreds | null {
  let raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) return null;
  raw = raw.replace(/^CLOUDINARY_URL=/, "").replace(/^["']|["']$/g, ""); // tolerate a pasted "CLOUDINARY_URL=…" or quotes
  const m = /^cloudinary:\/\/([^:@/\s]+):([^@/\s]+)@([a-z0-9_-]+)\/?$/i.exec(raw);
  if (!m) {
    throw new ConfigError(
      "CLOUDINARY_URL is not valid. Copy it exactly from Cloudinary → Settings → API Keys (\"API environment variable\"): cloudinary://<api_key>:<api_secret>@<cloud_name>",
    );
  }
  return { apiKey: decodeURIComponent(m[1]!), apiSecret: decodeURIComponent(m[2]!), cloudName: m[3]! };
}

/** "cloudinary" when UPLOAD_DRIVER=cloudinary, or automatically when CLOUDINARY_URL is set and UPLOAD_DRIVER is unset/"local". */
export function uploadDriver(): "local" | "cloudinary" {
  const d = (process.env.UPLOAD_DRIVER || "").trim().toLowerCase();
  if (d === "cloudinary") return "cloudinary";
  if ((d === "" || d === "local") && process.env.CLOUDINARY_URL?.trim()) return "cloudinary";
  if (d === "" || d === "local") return "local";
  throw new ConfigError(`Unknown UPLOAD_DRIVER "${process.env.UPLOAD_DRIVER}". Use "local" or "cloudinary".`);
}

export function uploadConfig() {
  return {
    // Driver is resolved by uploadDriver() only when storing, so a bad value never breaks unrelated code (e.g. the sanitiser).
    cloudinaryFolder: (process.env.CLOUDINARY_FOLDER || "the-forum").replace(/^\/+|\/+$/g, ""),
    dir: process.env.UPLOAD_DIR || ".uploads",
    maxBytes: Number(process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024),
    publicBase: process.env.UPLOAD_PUBLIC_BASE || "/api/uploads",
  };
}
