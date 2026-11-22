import type { Metadata } from "next";
import { Info } from "lucide-react";
import { resolveLocale } from "@/i18n/server";
import { getData } from "@/lib/data";
import { requireUser } from "@/lib/guard";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata: Metadata = { title: "Edit profile", robots: { index: false } };

export default async function EditProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  // Real database: signed-out visitors go to the login page first.
  const me = await requireUser(locale, "/settings/profile");
  const data = await getData();
  // Prototype (mock) mode has no accounts, so show a sample profile to explore the form.
  const user = me ?? (await data.getUserByUsername("ayesha-siddiqui"));
  const categories = await data.listCategories();
  if (!user) return null;
  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <p className="eyebrow mb-2">{dict.profile.editProfile}</p>
      <h1 className="font-display text-4xl text-ink">{dict.profile.editTitle}</h1>
      {!me && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          <Info className="mt-0.5 h-4 w-4 shrink-0" /> {dict.profile.demoNotice}
        </p>
      )}
      <ProfileForm user={user} categories={categories} />
    </div>
  );
}
