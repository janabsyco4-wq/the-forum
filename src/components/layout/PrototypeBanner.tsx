"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";

const KEY = "forum_banner_hidden";

/** Slim, dismissible strip that says the site runs on sample data. */
export function PrototypeBanner() {
  const { dict } = useI18n();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === "1") setHidden(true);
    } catch {}
  }, []);
  if (hidden) return null;
  return (
    <div className="relative border-b border-line bg-surface">
      <div className="mx-auto flex h-8 max-w-7xl items-center justify-center gap-2 px-10 text-[0.74rem] text-muted sm:px-14">
        <span className="relative inline-flex h-2 w-2 shrink-0">
          <span className="absolute inset-0 animate-ping rounded-full bg-spectrum opacity-60" />
          <span className="relative h-2 w-2 rounded-full bg-spectrum" />
        </span>
        <span className="shrink-0 font-semibold text-gradient">{dict.prototype.badge}</span>
        <span className="text-faint">·</span>
        <span className="truncate sm:hidden">{dict.prototype.bannerShort}</span>
        <span className="hidden truncate sm:inline">{dict.prototype.banner}</span>
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            try {
              sessionStorage.setItem(KEY, "1");
            } catch {}
          }}
          className="absolute end-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-faint hover:bg-surface-2 hover:text-ink sm:end-4"
          aria-label={dict.nav.close}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
