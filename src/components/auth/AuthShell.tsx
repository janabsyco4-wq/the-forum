import type { Dictionary } from "@/i18n";
import { Cover } from "@/components/ui/Cover";
import { LogoMark } from "@/components/ui/Logo";

export function AuthShell({ dict, title, body, children }: { dict: Dictionary; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="container-page grid min-h-[calc(100vh-8rem)] gap-10 py-12 lg:grid-cols-2 lg:items-center lg:py-16">
      <div className="mx-auto w-full max-w-md">
        <LogoMark className="h-10 w-10" />
        <h1 className="mt-6 font-display text-4xl text-ink">{title}</h1>
        <p className="mt-2 text-muted">{body}</p>
        <div className="mt-8">{children}</div>
      </div>
      <div className="relative hidden h-full min-h-[34rem] overflow-hidden rounded-[2rem] lg:block">
        <Cover seed="auth-aside-arches" tone="violet" motif={1} className="absolute inset-0" rounded="rounded-[2rem]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1629]/85 via-[#1c1b45]/20 to-transparent" />
        <blockquote className="absolute inset-x-10 bottom-10 text-white">
          <p className="font-display text-3xl leading-snug">“{dict.auth.asideQuote}”</p>
          <footer className="mt-4 text-sm text-white/75">— {dict.auth.asideAuthor}</footer>
        </blockquote>
      </div>
    </div>
  );
}
