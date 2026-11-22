"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { href } from "@/i18n/config";
import { useI18n } from "@/components/providers/I18nProvider";

export function SignOutLink({ label }: { label: string }) {
  const router = useRouter();
  const { locale } = useI18n();
  return (
    <button
      type="button"
      className="font-medium text-accent hover:underline"
      onClick={async () => {
        await api("POST /api/auth/logout");
        router.replace(href(locale, "/login"));
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
