import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter, Newsreader, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "../globals.css";
import { getDictionary } from "@/i18n";
import Link from "next/link";
import { SITE_URL, href, localeMeta, locales } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { getData, isPrototypeData } from "@/lib/data";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PrototypeBanner } from "@/components/layout/PrototypeBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap", style: ["normal", "italic"], axes: ["opsz"] });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], variable: "--font-naskh", display: "swap", preload: false });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], variable: "--font-nastaliq", display: "swap", preload: false });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${dict.brand.name} — ${dict.brand.tagline}`, template: `%s · ${dict.brand.name}` },
    description: dict.brand.description,
    applicationName: "THE FORUM",
    alternates: { canonical: `/${locale}`, languages: { en: "/en", ur: "/ur", "x-default": "/en" } },
    openGraph: { type: "website", siteName: "THE FORUM", locale: localeMeta[locale].ogLocale, title: dict.brand.name, description: dict.brand.description },
    twitter: { card: "summary_large_image", title: dict.brand.name, description: dict.brand.description },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090c15" },
  ],
};


export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { locale } = await resolveLocale(params);
  const dict = getDictionary(locale);
  const data = await getData();
  const user = await data.getCurrentUser();
  const meta = localeMeta[locale];
  // Theme is a cookie so the server renders the right colours on first paint (no inline script needed).
  const theme = (await cookies()).get("forum_theme")?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang={meta.htmlLang}
      dir={meta.dir}
      data-theme={theme}
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable} ${naskh.variable} ${nastaliq.variable}`}
    >
      <body className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <I18nProvider locale={locale} dict={dict}>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
            {dict.nav.skip}
          </a>
          {isPrototypeData && <PrototypeBanner />}
          <Header locale={locale} dict={dict} user={user} />
          {user && !user.emailVerified && !isPrototypeData && (
            <div className="border-b border-warning/30 bg-warning-soft">
              <p className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-sm text-warning">
                {dict.auth.verifyBanner}
                <Link href={href(locale, "/verify-email")} className="font-semibold underline underline-offset-2">{dict.auth.verifyNow}</Link>
              </p>
            </div>
          )}
          <main id="main">{children}</main>
          <Footer locale={locale} dict={dict} />
        </I18nProvider>
      </body>
    </html>
  );
}
