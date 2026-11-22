"use client";

import { useState } from "react";
import type { UserRole } from "@/types/domain";
import { api } from "@/lib/api/client";
import { useI18n } from "@/components/providers/I18nProvider";

const ROLES: UserRole[] = ["member", "writer", "ambassador", "moderator", "admin"];

export function RoleSelect({ userId, role }: { userId: string; role: UserRole }) {
  const { dict } = useI18n();
  const [value, setValue] = useState(role);
  const [note, setNote] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <select
        aria-label={dict.admin.changeRole}
        className="field h-8 w-36 py-0 text-xs"
        value={value}
        onChange={async (e) => {
          const next = e.target.value as UserRole;
          const res = await api("PATCH /api/admin/users/:id", { role: next }, { id: userId });
          if (res.ok) {
            setValue(next);
            setNote("✓");
          } else setNote(res.error.code === "NOT_IMPLEMENTED" ? dict.prototype.notSaved : res.error.message);
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{dict.roles[r]}</option>
        ))}
      </select>
      {note && <span className="text-[0.68rem] text-warning">{note}</span>}
    </span>
  );
}
