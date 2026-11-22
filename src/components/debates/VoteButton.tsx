"use client";

import { useState } from "react";
import { ArrowBigUp } from "lucide-react";
import { api } from "@/lib/api/client";
import { useI18n } from "@/components/providers/I18nProvider";
import { formatNumber } from "@/i18n";

/** Upvote an argument. If the API is not connected, shows a short inline note instead of faking the count. */
export function VoteButton({ argumentId, votes }: { argumentId: string; votes: number }) {
  const { dict, locale } = useI18n();
  const [count, setCount] = useState(votes);
  const [note, setNote] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-surface-2 hover:text-accent"
        aria-label={`${dict.debate.votes}: ${count}`}
        onClick={async () => {
          const res = await api("POST /api/arguments/:id/vote", { value: 1 }, { id: argumentId });
          if (res.ok) setCount(res.data.votes);
          else setNote(res.error.code === "NOT_IMPLEMENTED" ? dict.prototype.notSaved : res.error.message);
        }}
      >
        <ArrowBigUp className="h-4 w-4" /> {formatNumber(count, locale)}
      </button>
      {note && <span className="text-[0.7rem] text-warning">{note}</span>}
    </span>
  );
}
