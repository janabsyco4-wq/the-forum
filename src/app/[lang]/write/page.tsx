import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Info } from "lucide-react";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { requireUser } from "@/lib/guard";
import { WriteEditor } from "@/components/write/WriteEditor";

export const metadata: Metadata = { title: "Write", robots: { index: false } };

export default async function WritePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ slug?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  const { slug } = await searchParams;
  // Real database: you need an account to write; you come back here after signing in.
  const user = await requireUser(locale, slug ? `/write?slug=${encodeURIComponent(slug)}` : "/write");
  const data = await getData();
  const categories = await data.listCategories();

  // Editing an existing draft (or a piece sent back by editors). Only its author may.
  let initial = null;
  if (slug) {
    initial = await data.getArticleBySlug(slug);
    if (!initial || !user || initial.authorId !== user.id || !(initial.status === "draft" || initial.status === "rejected")) notFound();
  }

  return (
    <div className="container-page py-10 md:py-14">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-2">{dict.write.title}</p>
          <h1 className="font-display text-4xl text-ink">{initial ? dict.write.editing : dict.write.newPiece}</h1>
        </div>
        {!user && (
          <p className="flex max-w-md items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              {dict.write.signInNotice}{" "}
              <Link href={href(locale, "/login")} className="font-medium text-accent hover:underline">
                {dict.nav.signIn}
              </Link>
            </span>
          </p>
        )}
      </div>
      <WriteEditor categories={categories} initial={initial} />
    </div>
  );
}
