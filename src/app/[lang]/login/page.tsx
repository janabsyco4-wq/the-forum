import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/server";
import { redirectIfSignedIn, safeNext } from "@/lib/guard";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { AuthError } from "@/components/auth/AccountForms";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ next?: string; error?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const sp = await searchParams;
  const next = safeNext(sp.next);
  await redirectIfSignedIn(locale, next ?? undefined);
  return (
    <AuthShell dict={dict} title={dict.auth.loginTitle} body={dict.auth.loginBody}>
      <AuthError code={sp.error} />
      <LoginForm next={next} />
    </AuthShell>
  );
}
