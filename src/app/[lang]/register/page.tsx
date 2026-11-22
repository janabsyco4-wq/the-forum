import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/server";
import { redirectIfSignedIn, safeNext } from "@/lib/guard";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/AuthForms";
import { AuthError } from "@/components/auth/AccountForms";

export const metadata: Metadata = { title: "Join", robots: { index: false } };

export default async function RegisterPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ next?: string; error?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const sp = await searchParams;
  const next = safeNext(sp.next);
  await redirectIfSignedIn(locale, next ?? undefined);
  return (
    <AuthShell dict={dict} title={dict.auth.registerTitle} body={dict.auth.registerBody}>
      <AuthError code={sp.error} />
      <RegisterForm next={next} />
    </AuthShell>
  );
}
