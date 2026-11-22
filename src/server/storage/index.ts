/**
 * Pluggable file storage for uploads.
 *
 * `local` (default) writes to UPLOAD_DIR (default `.uploads/`, outside
 * `public/`) and serves files through GET /api/uploads/[...key]. Fine for
 * development and a single long-running server, NOT for serverless hosts.
 *
 * `cloudinary` uploads to Cloudinary (signed, server-side) and returns an
 * absolute https://res.cloudinary.com/... URL. It is picked when
 * UPLOAD_DRIVER=cloudinary, or automatically when CLOUDINARY_URL is set and
 * UPLOAD_DRIVER is unset/"local". Use it on Vercel.
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ConfigError, cloudinaryCreds, uploadConfig, uploadDriver, type CloudinaryCreds } from "../env";

export interface StoredFile {
  key: string; // e.g. "2026/11/3f9c…a1.webp"
  url: string; // public URL to put in <img src>
}

export interface StorageAdapter {
  put(data: Uint8Array, opts: { ext: string; contentType: string }): Promise<StoredFile>;
  /** Only needed by adapters that serve through our own route (local). */
  get?(key: string): Promise<{ data: Uint8Array; contentType: string } | null>;
}

export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;
export type ImageType = keyof typeof IMAGE_TYPES;

const EXT_TYPES: Record<string, ImageType> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

/** Detects the real image type from magic bytes — the client's MIME type is never trusted. SVG is rejected on purpose (scriptable). */
export function sniffImage(b: Uint8Array): ImageType | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a)
    return "image/png";
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61)
    return "image/gif";
  if (b.length >= 12 && String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP")
    return "image/webp";
  return null;
}

const KEY_RE = /^\d{4}\/\d{2}\/[a-f0-9]{32}\.(jpg|png|webp|gif)$/;

function localAdapter(): StorageAdapter {
  const cfg = uploadConfig();
  const root = path.resolve(process.cwd(), cfg.dir);
  return {
    async put(data, { ext }) {
      const now = new Date();
      const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
      const key = `${dir}/${randomBytes(16).toString("hex")}.${ext}`;
      await mkdir(path.join(root, dir), { recursive: true });
      await writeFile(path.join(root, key), data, { flag: "wx" });
      return { key, url: `${cfg.publicBase}/${key}` };
    },
    async get(key) {
      if (!KEY_RE.test(key)) return null; // blocks path traversal: only keys we generated
      try {
        const data = await readFile(path.join(root, key));
        return { data, contentType: EXT_TYPES[key.split(".").pop()!]! };
      } catch {
        return null;
      }
    },
  };
}

/**
 * Cloudinary signature: SHA-1 of the alphabetically sorted "k=v&…" upload
 * parameters (excluding file, api_key, resource_type, cloud_name) followed by
 * the API secret. https://cloudinary.com/documentation/authentication_signatures
 */
export function cloudinarySignature(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => !["file", "api_key", "resource_type", "cloud_name"].includes(k) && params[k] !== "" && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

/** Signed server-side upload to Cloudinary over plain fetch (no SDK). Files land in CLOUDINARY_FOLDER. */
function cloudinaryAdapter(creds: CloudinaryCreds, folder: string): StorageAdapter {
  return {
    async put(data, { contentType }) {
      const params = {
        folder,
        public_id: randomBytes(16).toString("hex"),
        timestamp: Math.floor(Date.now() / 1000),
      };
      const form = new FormData();
      form.append("file", new Blob([new Uint8Array(data)], { type: contentType }), `${params.public_id}`);
      form.append("api_key", creds.apiKey);
      form.append("folder", params.folder);
      form.append("public_id", params.public_id);
      form.append("timestamp", String(params.timestamp));
      form.append("signature", cloudinarySignature(params, creds.apiSecret));
      const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(creds.cloudName)}/image/upload`, {
        method: "POST",
        body: form,
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
      const json = (await res.json().catch(() => ({}))) as { secure_url?: string; public_id?: string; error?: { message?: string } };
      if (!res.ok || !json.secure_url || !json.public_id) {
        throw new Error(`Cloudinary upload failed (${res.status}): ${json.error?.message ?? "no secure_url in response"}`);
      }
      return { key: json.public_id, url: json.secure_url };
    },
  };
}

/** Local files are always readable through GET /api/uploads/…, even after switching to Cloudinary. */
export function localFileStore(): StorageAdapter {
  return localAdapter();
}

let cached: { sig: string; adapter: StorageAdapter } | undefined;
/** The active adapter. Re-resolved if the upload env vars change (Next reloads .env.local without a restart). */
export function storage(): StorageAdapter {
  const sig = `${process.env.UPLOAD_DRIVER ?? ""}|${process.env.CLOUDINARY_URL ?? ""}|${process.env.CLOUDINARY_FOLDER ?? ""}|${process.env.UPLOAD_DIR ?? ""}`;
  if (cached?.sig === sig) return cached.adapter;
  const driver = uploadDriver(); // throws ConfigError for an unknown driver
  let adapter: StorageAdapter;
  if (driver === "cloudinary") {
    const creds = cloudinaryCreds(); // throws ConfigError when malformed
    if (!creds) throw new ConfigError("UPLOAD_DRIVER=cloudinary but CLOUDINARY_URL is not set (see .env.example).");
    adapter = cloudinaryAdapter(creds, uploadConfig().cloudinaryFolder);
  } else {
    adapter = localAdapter();
  }
  cached = { sig, adapter };
  return adapter;
}
