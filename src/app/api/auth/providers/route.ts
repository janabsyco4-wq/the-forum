import { ok } from "@/server/http/route";
import { googleConfig, uploadDriver } from "@/server/env";
import { emailDeliveryConfigured } from "@/server/mail";

/**
 * GET /api/auth/providers → { google, emailDelivery, uploads }.
 * Lets the UI show "Continue with Google" only when it is really configured,
 * and shows where uploaded images go ("local" or "cloudinary").
 * Needs no database, so it answers even before MONGODB_URI is set.
 */
export async function GET() {
  let uploads: "local" | "cloudinary" | "misconfigured";
  try {
    uploads = uploadDriver();
  } catch {
    uploads = "misconfigured";
  }
  return ok({ google: googleConfig().configured, emailDelivery: emailDeliveryConfigured(), uploads });
}
