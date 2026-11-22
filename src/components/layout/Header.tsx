import Link from "next/link";
import { PenLine } from "lucide-react";
import type { Dictionary } from "@/i18n";
import type { Locale, PrivateUser } from "@/types/domain";
import { href } from "@/i18n/config";
import { Logo } from "@/components/ui/Logo";
import { BottomNav, LanguageSwitcher, MobileMenu, NavLinks, SearchButton, ThemeToggle, UserMenu, type HeaderUser, type NavItem } from "./HeaderClient";

export function navItems(dict: Dictionary): NavItem[] {
  return [
    { key: "articles", label: dict.nav.articles, path: "/articles", tone: "indigo" },
    { key: "debates", label: dict.nav.debates, path: "/debates", tone: "rose" },
    { key: "discussions", label: dict.nav.discussions, path: "/discussions", tone: "amber" },
    { key: "research", label: dict.nav.research, path: "/research", tone: "cyan" },
  ];
}

export function Header({ locale, dict, user }: { locale: Locale; dict: Dictionary; user: PrivateUser | null }) {
  const items = navItems(dict);
  const home: NavItem = { key: "home", label: dict.nav.home, path: "/", tone: "violet" };
  const write: NavItem = { key: "write", label: dict.nav.write, path: "/write", tone: "coral" };
  // Only what the client menus need — keeps the rest of the private profile off the wire.
  const me: HeaderUser | null = user ? { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl } : null;
  return (
    <>
      <header className="sticky top-0 z-50 bg-bg/85 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-bg/70">
        <div className="container-page flex h-16 items-center justify-between gap-3 lg:h-[4.25rem]">
          <Logo locale={locale} name={dict.brand.name} />
          <NavLinks items={items} />
          <div className="flex items-center gap-0.5">
            <SearchButton />
            <div className="hidden items-center gap-0.5 sm:flex">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <span className="mx-2 hidden h-6 w-px bg-line lg:block" />
            {me ? (
              <UserMenu user={me} />
            ) : (
              <Link href={href(locale, "/login")} className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink lg:inline-flex">
                {dict.nav.signIn}
              </Link>
            )}
            <Link href={href(locale, "/write")} className="btn btn-brand ms-1 hidden h-10 rounded-full px-5 lg:inline-flex">
              <PenLine className="h-4 w-4" />
              {dict.nav.write}
            </Link>
            <MobileMenu items={[home, ...items]} user={me} />
          </div>
        </div>
        <div className="spectrum-line" />
      </header>
      <BottomNav items={[home, items[0], write, items[1], items[2]]} />
    </>
  );
}
