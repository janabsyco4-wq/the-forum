import type { MetadataRoute } from "next";
import { SITE_URL } from "@/i18n/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/en/admin", "/ur/admin", "/en/write", "/ur/write", "/en/settings", "/ur/settings"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
