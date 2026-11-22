"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";

export function NewsletterForm() {
  const { dict } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  return (
    <form
      className="mb-10 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur sm:flex-row sm:items-center sm:p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "pending" });
        const res = await api("POST /api/newsletter", { email });
        setState(toActionState(res, dict.footer.subscribed));
        if (res.ok) setEmail("");
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        {dict.auth.email}
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={dict.footer.emailPlaceholder}
        className="h-11 w-full flex-1 rounded-xl border border-white/15 bg-white/10 px-4 text-white outline-none placeholder:text-white/40 focus:border-[#a5b4fc]"
        dir="ltr"
      />
      <button className="btn btn-brand h-11" disabled={state.kind === "pending"}>
        {state.kind === "pending" ? dict.common.loading : dict.footer.subscribe}
      </button>
      {state.kind !== "idle" && state.kind !== "pending" && <ActionNotice state={state} className="sm:max-w-sm" />}
    </form>
  );
}
