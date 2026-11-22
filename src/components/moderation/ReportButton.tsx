"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, X } from "lucide-react";
import type { ReportReason, ReportTarget } from "@/types/domain";
import { api } from "@/lib/api/client";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";

const REASONS: ReportReason[] = ["spam", "harassment", "hate-speech", "misinformation", "plagiarism", "off-topic", "other"];

export function ReportButton({ targetType, targetId, compact = false }: { targetType: ReportTarget; targetId: string; preview?: string; compact?: boolean }) {
  const { dict } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setState({ kind: "idle" });
          setOpen(true);
        }}
        className={compact ? "inline-flex items-center gap-1 hover:text-danger" : "btn btn-ghost btn-sm"}
      >
        <Flag className="h-3.5 w-3.5" /> {dict.common.report}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-float backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        <form
          className="p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setState({ kind: "pending" });
            const res = await api("POST /api/reports", { targetType, targetId, reason, details: details || undefined });
            setState(toActionState(res, "✓"));
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">{dict.report.title}</h2>
              <p className="mt-1 text-sm text-muted">{dict.report.body}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm w-8 px-0" aria-label={dict.nav.close}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <fieldset className="mt-5 space-y-1.5">
            <legend className="label">{dict.report.reason}</legend>
            {REASONS.map((r) => (
              <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${reason === r ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"}`}>
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--accent)]" />
                {dict.report.reasons[r]}
              </label>
            ))}
          </fieldset>
          <label className="label mt-4" htmlFor={`report-details-${targetId}`}>
            {dict.report.details}
          </label>
          <textarea id={`report-details-${targetId}`} value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="field" maxLength={1000} />
          <ActionNotice state={state} className="mt-4" />
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              {dict.common.cancel}
            </button>
            <button className="btn btn-primary" disabled={state.kind === "pending"}>
              {dict.report.send}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
