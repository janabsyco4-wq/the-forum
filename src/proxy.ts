import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["en", "ur"];
const DEFAULT = "en";

/** Picks a locale from the saved cookie, then Accept-Language, then the default. */
function pickLocale(req: NextRequest): string {
  const saved = req.cookies.get("forum_locale")?.value;
  if (saved && LOCALES.includes(saved)) return saved;
  const header = req.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => LOCALES.includes(r.lang))?.lang ?? DEFAULT;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;
  const url = req.nextUrl.clone();
  url.pathname = `/${pickLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next internals and files with an extension (images, robots.txt, sitemap.xml…)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
