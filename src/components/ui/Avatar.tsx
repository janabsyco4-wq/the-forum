import type { User } from "@/types/domain";

// Muted tonal gradients (one hue, two depths) — varied but calm.
const grads = [
  ["#2f3180", "#4a4fc9"],
  ["#5a2236", "#b8445f"],
  ["#1d4d3a", "#2f7d5b"],
  ["#1f4a5e", "#2f7593"],
  ["#4e2349", "#9c4790"],
  ["#5e4214", "#a8741f"],
  ["#3b2a78", "#6d4fc2"],
  ["#1c4a4a", "#2d7a79"],
  ["#2a3346", "#566174"],
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = [...(parts[0] ?? "")][0] ?? "";
  const last = parts.length > 1 ? ([...parts[parts.length - 1]][0] ?? "") : "";
  return (first + last).toUpperCase();
}

const sizes = { xs: "h-6 w-6 text-[0.6rem]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg", xl: "h-24 w-24 text-3xl md:h-28 md:w-28" };

export function avatarGradient(id: string) {
  const [a, b] = grads[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % grads.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function Avatar({ user, size = "md", ring = false }: { user: Pick<User, "name" | "avatarUrl" | "id">; size?: keyof typeof sizes; ring?: boolean }) {
  const cls = `${sizes[size]} shrink-0 rounded-full ${ring ? "ring-2 ring-surface" : ""}`;
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt="" className={`${cls} object-cover`} />;
  }
  return (
    <span className={`${cls} inline-flex select-none items-center justify-center font-semibold text-white`} style={{ background: avatarGradient(user.id) }} aria-hidden="true">
      {initials(user.name)}
    </span>
  );
}
