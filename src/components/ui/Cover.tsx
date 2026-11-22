/**
 * Generative editorial cover art. Used whenever a piece has no uploaded image,
 * so every card looks intentional without depending on external photos.
 * Deterministic: the same seed always produces the same cover.
 * Pass a `tone` to colour it by category; otherwise the seed picks one.
 */
import type { Tone } from "@/lib/ui/tones";
import { hashTone } from "@/lib/ui/tones";

type Pal = { from: string; to: string; fg: string; ink: string };

/**
 * Monochrome, editorial palettes: each tone is one muted hue in four depths
 * [deep, mid, light, pale]. Dark covers get a warm ivory accent; light covers a deep one.
 * Restraint is what makes the covers read as premium rather than loud.
 */
const ramps: Record<Tone, [string, string, string, string]> = {
  indigo: ["#1c1b45", "#3b3d94", "#b4b8e8", "#eef0fa"],
  violet: ["#241a45", "#54409a", "#c6bce8", "#f2eff9"],
  fuchsia: ["#331731", "#7d3a74", "#dfc0d8", "#f9f0f6"],
  rose: ["#36161f", "#8c3449", "#e8c3cc", "#fbf1f3"],
  coral: ["#371c13", "#93492e", "#ebcdbf", "#fbf3ef"],
  amber: ["#33260f", "#8a6223", "#e6d5b0", "#faf6ec"],
  lime: ["#202a10", "#536e25", "#d0dcb3", "#f4f7ed"],
  emerald: ["#0f2a20", "#2c6c50", "#b9d8c8", "#eef6f2"],
  teal: ["#0f2829", "#2a6667", "#b8d8d7", "#eef6f6"],
  cyan: ["#0f2530", "#2b627b", "#b9d4e1", "#eef5f9"],
  sky: ["#111f37", "#355890", "#bfcde8", "#eff3fa"],
  slate: ["#131924", "#3b4556", "#c9ced8", "#f2f4f7"],
};
const IVORY = "#efe6d4";
const palettes = Object.fromEntries(
  Object.entries(ramps).map(([k, [deep, mid, light, pale]]) => [
    k,
    [
      { from: deep, to: mid, fg: light, ink: IVORY },
      { from: pale, to: light, fg: mid, ink: deep },
    ],
  ]),
) as Record<Tone, Pal[]>;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function Cover({
  seed,
  label,
  className = "",
  motif,
  tone,
  rounded = "rounded-2xl",
}: {
  seed: string;
  label?: string;
  className?: string;
  motif?: 0 | 1 | 2 | 3 | 4;
  tone?: Tone;
  rounded?: string;
}) {
  const h = hash(seed);
  const set = palettes[tone ?? hashTone(seed)];
  const p = set[(h >>> 3) % set.length];
  const m = motif ?? ((h >>> 4) % 5);
  const r = (n: number) => ((h >>> n) & 0xff) / 255;
  const gid = `g${h.toString(36)}`;

  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={p.from} />
            <stop offset="1" stopColor={p.to} />
          </linearGradient>
        </defs>
        <rect width="400" height="250" fill={`url(#${gid})`} />
        {m === 0 && (
          // Sun over horizon lines
          <g>
            <circle cx={120 + r(1) * 160} cy={118} r={60} fill={p.ink} opacity={0.95} />
            {Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={0} y={150 + i * 12} width={400} height={5 - i * 0.35} fill={p.fg} opacity={0.75} />
            ))}
          </g>
        )}
        {m === 1 && (
          // Mughal arches
          <g fill="none" stroke={p.fg} strokeWidth={3} opacity={0.9}>
            {Array.from({ length: 5 }, (_, i) => {
              const x = 20 + i * 80;
              return <path key={i} d={`M${x} 260 V140 Q${x} 70 ${x + 30} 50 Q${x + 60} 70 ${x + 60} 140 V260`} />;
            })}
            <circle cx={50 + Math.round(r(3) * 4) * 80} cy={110} r={11} fill={p.ink} stroke="none" />
          </g>
        )}
        {m === 2 && (
          // River waves
          <g fill="none" strokeWidth={2.5}>
            {Array.from({ length: 10 }, (_, i) => (
              <path
                key={i}
                stroke={i % 3 === 1 ? p.ink : p.fg}
                opacity={0.85}
                d={`M-10 ${40 + i * 22} C 80 ${20 + i * 22 + r(i) * 30}, 160 ${70 + i * 22}, 240 ${45 + i * 22} S 380 ${30 + i * 22}, 420 ${50 + i * 22}`}
              />
            ))}
          </g>
        )}
        {m === 3 && (
          // Dot grid with a quarter circle
          <g>
            <circle cx={400} cy={250} r={170 + r(2) * 40} fill={p.fg} opacity={0.9} />
            <circle cx={400} cy={250} r={90 + r(5) * 20} fill={p.ink} opacity={0.9} />
            {Array.from({ length: 12 }, (_, i) =>
              Array.from({ length: 8 }, (_, j) => <circle key={`${i}-${j}`} cx={20 + i * 26} cy={20 + j * 26} r={2.2} fill={p.fg} opacity={0.55} />),
            )}
          </g>
        )}
        {m === 4 && (
          // Stacked pills
          <g>
            {Array.from({ length: 6 }, (_, i) => (
              <rect key={i} x={40 + i * 54} y={60 + ((h >>> i) % 5) * 22} width={34} height={260} rx={17} fill={i % 3 === 2 ? p.ink : p.fg} opacity={i % 2 ? 0.95 : 0.6} />
            ))}
          </g>
        )}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      {label && (
        <span
          className="absolute bottom-3 start-3 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] backdrop-blur-sm"
          style={{ background: "rgb(255 255 255 / 0.88)", color: "#0f1629" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
