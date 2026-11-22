import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { homeFor, requireUser, safeNext } from "@/lib/guard";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyEmailForm } from "@/components/auth/AccountForms";
import { SignOutLink } from "@/components/auth/SignOutLink";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false } };

export default async function VerifyEmailPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const next = safeNext((await searchParams).next);
  const user = await requireUser(locale, next ? `/verify-email?next=${encodeURIComponent(next)}` : "/verify-email");
  // Prototype mode has no accounts; already-confirmed users have nothing to do here.
  if (!user) redirect(href(locale, "/login"));
  if (user.emailVerified) redirect(next ?? homeFor(user, locale));
  return (
    <AuthShell dict={dict} title={dict.auth.verifyTitle} body={dict.auth.verifyBanner}>
      <VerifyEmailForm email={user.email} next={next} />
      <p className="mt-6 text-center text-sm text-muted">
        <SignOutLink label={dict.auth.notYou} />
      </p>
    </AuthShell>
  );
}
