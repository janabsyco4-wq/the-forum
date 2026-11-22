import Link from "next/link";
import { formatDate } from "@/i18n";
import { resolveLocale } from "@/i18n/server";
import { href } from "@/i18n/config";
import { getData } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/primitives";
import { AdminAction } from "@/components/admin/AdminAction";
import { requireStaff } from "@/lib/guard";
import { RoleSelect } from "@/components/admin/RoleSelect";

export default async function AdminUsers({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale, dict } = await resolveLocale(params);
  await requireStaff(locale, "C:/Program Files/Git/admin/users");
  const t = dict.admin;
  const { q } = await searchParams;
  const res = await (await getData()).listUsers({ search: q, pageSize: 100 });
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl text-ink">{t.users}</h2>
        <form action={href(locale, "/admin/users")} role="search">
          <label className="sr-only" htmlFor="uq">{dict.nav.search}</label>
          <input id="uq" name="q" defaultValue={q} placeholder={dict.nav.search} className="field h-10 w-full sm:w-64" />
        </form>
      </div>
      {/* Phones: card list */}
      <ul className="divide-y divide-line md:hidden">
        {res.items.map((u) => (
          <li key={u.id} className="space-y-3 p-4">
            <Link href={href(locale, `/u/${u.username}`)} className="flex items-center gap-3">
              <Avatar user={u} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{u.name}</span>
                <span className="block truncate text-xs text-muted">@{u.username} · {u.university}</span>
              </span>
              <Badge tone={u.status === "active" ? "success" : u.status === "suspended" ? "danger" : "warning"}>{u.status === "pending" ? t.statuses.pending : t.statuses[u.status]}</Badge>
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <RoleSelect userId={u.id} role={u.role} />
              {u.status === "suspended" ? (
                <AdminAction endpoint="PATCH /api/admin/users/:id" params={{ id: u.id }} body={{ status: "active" }} label={t.reinstate} />
              ) : (
                <AdminAction endpoint="PATCH /api/admin/users/:id" params={{ id: u.id }} body={{ status: "suspended" }} label={t.suspend} tone="danger" />
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-bg-subtle text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-5 py-3 text-start font-medium">{t.table.name}</th>
              <th className="px-5 py-3 text-start font-medium">{t.table.role}</th>
              <th className="px-5 py-3 text-start font-medium">{t.table.status}</th>
              <th className="px-5 py-3 text-start font-medium">{t.table.joined}</th>
              <th className="px-5 py-3 text-end font-medium">{t.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {res.items.map((u) => (
              <tr key={u.id} className="hover:bg-bg-subtle/60">
                <td className="px-5 py-3">
                  <Link href={href(locale, `/u/${u.username}`)} className="flex items-center gap-3">
                    <Avatar user={u} size="sm" />
                    <span>
                      <span className="block font-medium text-ink">{u.name}</span>
                      <span className="block text-xs text-muted">@{u.username} · {u.university}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <RoleSelect userId={u.id} role={u.role} />
                </td>
                <td className="px-5 py-3">
                  <Badge tone={u.status === "active" ? "success" : u.status === "suspended" ? "danger" : "warning"}>{u.status === "pending" ? t.statuses.pending : t.statuses[u.status]}</Badge>
                </td>
                <td className="px-5 py-3 text-muted">{formatDate(u.joinedAt, locale)}</td>
                <td className="px-5 py-3 text-end">
                  {u.status === "suspended" ? (
                    <AdminAction endpoint="PATCH /api/admin/users/:id" params={{ id: u.id }} body={{ status: "active" }} label={t.reinstate} />
                  ) : (
                    <AdminAction endpoint="PATCH /api/admin/users/:id" params={{ id: u.id }} body={{ status: "suspended" }} label={t.suspend} tone="danger" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
