import Link from "next/link";
import { formatDate, formatNumber } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { Badge } from "@/components/ui/primitives";
import { statusTone } from "@/components/debates/status";
import { requireStaff } from "@/lib/guard";
import { DebateForm, ConclusionForm } from "@/components/admin/DebateForms";

export default async function AdminDebates({ params }: { params: Promise<{ lang: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  await requireStaff(locale, "C:/Program Files/Git/admin/debates");
  const t = dict.admin;
  const data = await getData();
  const [debates, categories] = await Promise.all([data.listDebates(), data.listCategories()]);
  const needsConclusion = debates.filter((d) => d.status === "closed" || (d.status === "open" && !d.conclusion));

  return (
    <div className="space-y-8">
      <section className="card overflow-hidden">
        <div className="border-b border-line p-5">
          <h2 className="font-display text-xl text-ink">{t.debates}</h2>
        </div>
        <ul className="divide-y divide-line">
          {debates.map((d) => (
            <li key={d.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-faint">
                    {dict.debates.week} {formatNumber(d.weekNumber, locale)}
                  </span>
                  <Badge tone={statusTone(d.status)}>{dict.debates.status[d.status]}</Badge>
                </div>
                <Link href={href(locale, `/debates/${d.slug}`)} className="mt-1 block font-medium text-ink hover:text-accent" lang={d.language}>
                  {d.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  {formatDate(d.opensAt, locale)} → {formatDate(d.closesAt, locale)} · {formatNumber(d.stats.arguments, locale)} {dict.common.arguments}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-5 font-display text-xl text-ink">{t.createDebate}</h2>
          <DebateForm categories={categories.map((c) => ({ slug: c.slug, name: locale === "ur" && c.name.ur ? c.name.ur : c.name.en }))} />
        </section>
        <section className="card p-6">
          <h2 className="mb-5 font-display text-xl text-ink">{t.writeConclusion}</h2>
          <ConclusionForm debates={needsConclusion.map((d) => ({ id: d.id, title: d.title, sides: d.sides }))} />
        </section>
      </div>
    </div>
  );
}
