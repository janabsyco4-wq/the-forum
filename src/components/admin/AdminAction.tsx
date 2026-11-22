"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiEndpoints } from "@/lib/api/contract";
import { api } from "@/lib/api/client";
import { useI18n } from "@/components/providers/I18nProvider";

type E = keyof ApiEndpoints;

/** A single moderation/admin button wired to the API contract. Shows an honest inline result. */
export function AdminAction<K extends E>({
  endpoint,
  body,
  params,
  label,
  tone = "outline",
}: {
  endpoint: K;
  body: ApiEndpoints[K][0];
  params: Record<string, string>;
  label: string;
  tone?: "outline" | "primary" | "danger" | "ghost";
}) {
  const { dict } = useI18n();
  const router = useRouter();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const cls = { outline: "btn-outline", primary: "btn-primary", ghost: "btn-ghost", danger: "btn-outline text-danger hover:border-danger" }[tone];
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        className={`btn btn-sm ${cls}`}
        onClick={async () => {
          setBusy(true);
          const res = await api(endpoint, body, params);
          setBusy(false);
          if (res.ok) {
            setNote({ ok: true, text: "✓" });
            router.refresh();
          } else setNote({ ok: false, text: res.error.code === "NOT_IMPLEMENTED" ? dict.prototype.notSaved : res.error.message });
        }}
      >
        {label}
      </button>
      {note && <span className={`text-[0.68rem] ${note.ok ? "text-success" : "text-warning"}`}>{note.text}</span>}
    </span>
  );
}
