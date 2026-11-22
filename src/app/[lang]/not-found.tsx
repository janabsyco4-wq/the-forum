import Link from "next/link";
import { getDictionary } from "@/i18n";
import { Cover } from "@/components/ui/Cover";

// not-found pages do not receive params; show bilingual copy and link to both homes.
export default function NotFound() {
  const en = getDictionary("en");
  const ur = getDictionary("ur");
  return (
    <div className="container-page grid min-h-[60vh] items-center gap-10 py-20 md:grid-cols-2">
      <div>
        <p className="font-display text-7xl text-gradient">404</p>
        <h1 className="mt-4 font-display text-4xl text-ink">{en.notFound.title}</h1>
        <p className="mt-3 text-muted">{en.notFound.body}</p>
        <p className="mt-6 font-[family-name:var(--font-naskh)] text-xl leading-loose text-ink-2" lang="ur" dir="rtl">
          {ur.notFound.title}
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/en" className="btn btn-primary">{en.notFound.home}</Link>
          <Link href="/ur" className="btn btn-outline" lang="ur">{ur.notFound.home}</Link>
        </div>
      </div>
      <Cover seed="not-found-river" motif={2} className="aspect-[4/3] w-full" rounded="rounded-3xl" />
    </div>
  );
}
