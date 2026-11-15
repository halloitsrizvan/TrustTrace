import { useId } from "react";
import { BadgeCheck, Hourglass, ShieldX, Star, Medal, ShieldCheck, Heart, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import type { BadgeCode } from "@/lib/api/types";

export type StampKind = "verified" | "review" | "rejected";

const kinds = {
  verified: { color: "var(--found)", ink: "var(--found-ink)", label: copy.stamp.verified, Icon: BadgeCheck, round: true },
  review: { color: "var(--review)", ink: "var(--review-ink)", label: copy.stamp.review, Icon: Hourglass, round: false },
  rejected: { color: "var(--rejected)", ink: "var(--rejected-ink)", label: copy.stamp.rejected, Icon: ShieldX, round: true },
} as const;

/** Ink-bleed filter shared by every stamp. */
function BleedFilter({ id }: { id: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" result="d" />
      <feGaussianBlur in="d" stdDeviation="0.35" />
    </filter>
  );
}

export function Stamp({
  kind,
  size = 132,
  tilt = -8,
  className,
}: {
  kind: StampKind;
  size?: number;
  tilt?: number;
  className?: string;
}) {
  const fid = useId().replace(/:/g, "");
  const k = kinds[kind];
  const Icon = k.Icon;
  const w = k.round ? size : Math.round(size * 1.5);
  const h = size;
  return (
    <div
      role="img"
      aria-label={k.label}
      className={cn("relative inline-block", className)}
      style={{ width: w, height: h, transform: `rotate(${tilt}deg)`, color: k.ink }}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="absolute inset-0">
        <defs>
          <BleedFilter id={fid} />
        </defs>
        <g filter={`url(#${fid})`} fill="none" stroke={k.color} strokeWidth="4">
          {k.round ? (
            <>
              <circle cx={w / 2} cy={h / 2} r={w / 2 - 4} />
              <circle cx={w / 2} cy={h / 2} r={w / 2 - 12} strokeWidth="1.5" />
            </>
          ) : (
            <>
              <rect x="4" y="4" width={w - 8} height={h - 8} rx="10" />
              <rect x="11" y="11" width={w - 22} height={h - 22} rx="6" strokeWidth="1.5" />
            </>
          )}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center" style={{ filter: `url(#${fid})` }}>
        <Icon size={Math.round(size * 0.24)} strokeWidth={1.75} aria-hidden />
        <span className="font-display leading-none" style={{ fontSize: Math.round(size * (k.round ? 0.14 : 0.16)) }}>
          {k.label}
        </span>
      </div>
    </div>
  );
}

/** Passport-style seal: a distinct silhouette per badge. */
const seals: Record<BadgeCode, { Icon: typeof Star; color: string; path: string }> = {
  FIRST_RETURN: { Icon: Star, color: "var(--ultra)", path: "circle" },
  CAMPUS_HERO: { Icon: Medal, color: "var(--lost)", path: "scallop" },
  GUARDIAN: { Icon: ShieldCheck, color: "var(--found)", path: "shield" },
  GRATEFUL_SOUL: { Icon: Heart, color: "var(--rejected)", path: "diamond" },
  GENEROUS: { Icon: HandCoins, color: "var(--review)", path: "hex" },
};

function sealShape(path: string, s: number) {
  const c = s / 2;
  switch (path) {
    case "scallop": {
      const pts: string[] = [];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const r = i % 2 ? c - 7 : c - 2;
        pts.push(`${c + Math.cos(a) * r},${c + Math.sin(a) * r}`);
      }
      return <polygon points={pts.join(" ")} />;
    }
    case "shield":
      return <path d={`M${c} 3 L${s - 5} 10 V${c + 2} C${s - 5} ${s - 12} ${c + 8} ${s - 6} ${c} ${s - 3} C${c - 8} ${s - 6} 5 ${s - 12} 5 ${c + 2} V10 Z`} />;
    case "diamond":
      return <rect x={c - (c - 6) * 0.72} y={c - (c - 6) * 0.72} width={(c - 6) * 1.44} height={(c - 6) * 1.44} transform={`rotate(45 ${c} ${c})`} rx="4" />;
    case "hex": {
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        pts.push(`${c + Math.cos(a) * (c - 3)},${c + Math.sin(a) * (c - 3)}`);
      }
      return <polygon points={pts.join(" ")} />;
    }
    default:
      return <circle cx={c} cy={c} r={c - 3} />;
  }
}

export function BadgeSeal({ code, size = 56, showName }: { code: BadgeCode; size?: number; showName?: boolean }) {
  const s = seals[code];
  const Icon = s.Icon;
  const name = copy.badge[code]?.name ?? code;
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div role="img" aria-label={name} className="relative" style={{ width: size, height: size, transform: "rotate(-6deg)" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <g fill="var(--surface)" stroke={s.color} strokeWidth="3" strokeLinejoin="round">
            {sealShape(s.path, size)}
          </g>
        </svg>
        <div className="absolute inset-0 grid place-items-center" style={{ color: s.color }}>
          <Icon size={Math.round(size * 0.42)} strokeWidth={1.75} aria-hidden />
        </div>
      </div>
      {showName ? <span className="text-xs font-bold text-ink">{name}</span> : null}
    </div>
  );
}
