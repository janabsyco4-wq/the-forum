import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/AccountForms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ForgotPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { dict } = await resolveLocale(params);
  return (
    <AuthShell dict={dict} title={dict.auth.forgotTitle} body={dict.auth.forgotBody}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
