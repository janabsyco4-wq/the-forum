import { route } from "@/server/http/route";
import { requireUser } from "@/server/auth";
import { invalid } from "@/server/http/errors";
import { LIMITS, rateLimit } from "@/server/security/rate-limit";
import { IMAGE_TYPES, sniffImage, storage } from "@/server/storage";
import { uploadConfig } from "@/server/env";

/**
 * POST /api/uploads (multipart/form-data, field "file") → { url }.
 * Images only (JPEG, PNG, WebP, GIF), ≤ 5 MB. The type is detected from the
 * file's bytes, not from the client-supplied MIME type or filename.
 */
export const POST = route(async (req) => {
  const me = await requireUser();
  await rateLimit(LIMITS.upload, me._id.toString());
  const { maxBytes } = uploadConfig();

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes + 64 * 1024) throw invalid(`Images must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`, { file: "Too large" });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw invalid("Send the image as multipart/form-data with a `file` field.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw invalid("No file uploaded.", { file: "Required" });
  if (file.size === 0) throw invalid("The file is empty.", { file: "Empty" });
  if (file.size > maxBytes) throw invalid(`Images must be ${Math.round(maxBytes / 1024 / 1024)} MB or smaller.`, { file: "Too large" });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) throw invalid("Only JPEG, PNG, WebP or GIF images are allowed.", { file: "Unsupported type" });

  const stored = await storage().put(bytes, { ext: IMAGE_TYPES[type], contentType: type });
  return { url: stored.url };
});
