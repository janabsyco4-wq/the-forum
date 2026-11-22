import Link from "next/link";
import type { ReportStatus } from "@/types/domain";
import { timeAgo } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { userMap } from "@/lib/data/helpers";
import { Badge } from "@/components/ui/primitives";
import { requireStaff } from "@/lib/guard";
import { AdminAction } from "@/components/admin/AdminAction";

const TABS: (ReportStatus | "all")[] = ["all", "open", "reviewing", "resolved", "dismissed"];

export default async function AdminReports({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ status?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  await requireStaff(locale, "C:/Program Files/Git/admin/reports");
  const t = dict.admin;
  const sp = await searchParams;
  const status = TABS.includes(sp.status as ReportStatus) ? (sp.status as ReportStatus | "all") : "all";
  const data = await getData();
  const reports = await data.listReports(status === "all" ? {} : { status });
  const people = await userMap(data, [...reports.map((r) => r.reporterId), ...reports.map((r) => r.resolvedBy)]);
  const contentType = (tt: string) => (["comment", "argument", "discussion"].includes(tt) ? (tt as "comment" | "argument" | "discussion") : null);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl text-ink">{t.reports}</h2>
        <div className="flex flex-wrap gap-2">
          {TABS.map((s) => (
            <Link key={s} href={`${href(locale, "/admin/reports")}${s === "all" ? "" : `?status=${s}`}`} className={`chip ${status === s ? "chip-active" : ""}`}>
              {s === "all" ? dict.common.all : t.statuses[s]}
            </Link>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-line">
        {reports.length === 0 && <li className="p-10 text-center text-sm text-muted">{dict.common.noResults}</li>}
        {reports.map((r) => {
          const ct = contentType(r.targetType);
          const open = r.status === "open" || r.status === "reviewing";
          return (
            <li key={r.id} className="grid gap-4 p-5 md:grid-cols-12 md:items-start">
              <div className="md:col-span-7">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="danger">{dict.report.reasons[r.reason]}</Badge>
                  <Badge>{r.targetType}</Badge>
                  <Badge tone={open ? "warning" : r.status === "resolved" ? "success" : "neutral"}>{t.statuses[r.status]}</Badge>
                </div>
                <blockquote className="mt-3 border-s-2 border-line-strong ps-3 text-sm italic text-ink-2">{r.targetPreview}</blockquote>
                {r.details && <p className="mt-2 text-sm text-muted">{r.details}</p>}
                <p className="mt-2 text-xs text-faint">
                  {t.table.reporter}: {people.get(r.reporterId)?.name ?? "—"} · {timeAgo(r.createdAt, locale)}
                </p>
                {r.resolution && (
                  <p className="mt-2 rounded-lg bg-bg-subtle px-3 py-2 text-xs text-muted">
                    {people.get(r.resolvedBy ?? "")?.name}: {r.resolution}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-5 md:justify-end">
                {open && (
                  <>
                    {ct && <AdminAction endpoint="PATCH /api/admin/content/:type/:id" params={{ type: ct, id: r.targetId }} body={{ status: "hidden" }} label={t.hide} tone="danger" />}
                    <AdminAction endpoint="PATCH /api/admin/reports/:id" params={{ id: r.id }} body={{ status: "resolved", resolution: "Action taken" }} label={t.resolve} tone="primary" />
                    <AdminAction endpoint="PATCH /api/admin/reports/:id" params={{ id: r.id }} body={{ status: "dismissed" }} label={t.dismiss} />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
