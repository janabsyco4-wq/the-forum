"use client";

import { CircleCheck, FlaskConical, TriangleAlert } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";

export type ActionState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; message: string }
  | { kind: "prototype" }
  | { kind: "error"; message: string };

/**
 * Honest feedback for any write action. "prototype" means the backend endpoint
 * is not connected — we say so plainly instead of faking success.
 */
export function ActionNotice({ state, className = "" }: { state: ActionState; className?: string }) {
  const { dict } = useI18n();
  if (state.kind === "idle" || state.kind === "pending") return null;
  const styles = {
    success: "border-success/30 bg-success-soft text-success",
    prototype: "border-warning/30 bg-warning-soft text-warning",
    error: "border-danger/30 bg-danger-soft text-danger",
  }[state.kind];
  const Icon = state.kind === "success" ? CircleCheck : state.kind === "prototype" ? FlaskConical : TriangleAlert;
  return (
    <div role="status" aria-live="polite" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {state.kind === "prototype" ? (
          <>
            <p className="font-semibold">{dict.prototype.notSaved}</p>
            <p className="mt-0.5 opacity-90">{dict.prototype.notSavedBody}</p>
          </>
        ) : (
          <p>{state.message}</p>
        )}
      </div>
    </div>
  );
}

/** Map an ApiResult to an ActionState. */
export function toActionState(res: { ok: true } | { ok: false; error: { code: string; message: string } }, successMessage: string): ActionState {
  if (res.ok) return { kind: "success", message: successMessage };
  if (res.error.code === "NOT_IMPLEMENTED") return { kind: "prototype" };
  return { kind: "error", message: res.error.message };
}
