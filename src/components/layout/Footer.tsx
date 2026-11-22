import Link from "next/link";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/types/domain";
import { href } from "@/i18n/config";
import { LogoMark } from "@/components/ui/Logo";
import { NewsletterForm } from "./NewsletterForm";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const cols = [
    {
      title: dict.footer.platform,
      color: "text-white/45",
      links: [
        [dict.nav.articles, "/articles"],
        [dict.nav.debates, "/debates"],
        [dict.nav.discussions, "/discussions"],
        [dict.nav.research, "/research"],
        [dict.nav.write, "/write"],
      ],
    },
    {
      title: dict.footer.organisation,
      color: "text-white/45",
      links: [
        [dict.nav.join, "/register"],
        [dict.footer.guidelines, "/discussions/community-guidelines-read-first"],
        [dict.footer.editorial, "/write"],
        [dict.nav.admin, "/admin"],
      ],
    },
  ];
  return (
    <footer className="relative mt-20 overflow-hidden bg-[#090c15] text-white md:mt-28">
      <div className="h-px bg-[linear-gradient(90deg,transparent,#6d4fc2_30%,#9c4790_70%,transparent)]" />
      <div className="pointer-events-none absolute -start-32 top-10 h-80 w-80 rounded-full bg-[#4a4fc9]/15 blur-3xl" />
      <div className="pointer-events-none absolute -end-32 bottom-0 h-80 w-80 rounded-full bg-[#9c4790]/10 blur-3xl" />
      <div className="container-page relative grid gap-10 py-14 sm:grid-cols-2 md:py-16 lg:grid-cols-12">
        <div className="sm:col-span-2 lg:col-span-6">
          <Link href={href(locale)} className="inline-flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-display text-xl font-semibold">{dict.brand.name}</span>
          </Link>
          <p className="mt-4 font-display text-2xl text-gradient">{dict.brand.tagline}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">{dict.footer.about}</p>
        </div>
        {cols.map((c) => (
          <div key={c.title} className="lg:col-span-2">
            <p className={`text-sm font-bold uppercase tracking-wider ${c.color}`}>{c.title}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([label, path]) => (
                <li key={path + label}>
                  <Link href={href(locale, path)} className="text-sm text-white/70 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="text-sm font-bold uppercase tracking-wider text-white/45">{dict.footer.newsletter}</p>
          <p className="mt-4 text-sm leading-relaxed text-white/65">{dict.footer.newsletterBody}</p>
        </div>
      </div>
      <div className="container-page relative">
        <NewsletterForm />
      </div>
      <div className="container-page relative flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/50 md:flex-row md:justify-between">
        <p>
          © {new Date().getFullYear()} {dict.brand.name}. {dict.footer.rights}
        </p>
        <p>{dict.brand.tagline}</p>
      </div>
    </footer>
  );
}
