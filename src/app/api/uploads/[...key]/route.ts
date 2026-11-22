import type { NextRequest } from "next/server";
import { localFileStore } from "@/server/storage";

/**
 * GET /api/uploads/:key — serves files written by the local storage adapter.
 * Keys are validated against the exact format we generate (no traversal).
 * Always reads the local store, so older local images keep working after a
 * switch to Cloudinary (whose URLs point at res.cloudinary.com directly).
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const s = localFileStore();
  const file = s.get ? await s.get(key.join("/")) : null;
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
