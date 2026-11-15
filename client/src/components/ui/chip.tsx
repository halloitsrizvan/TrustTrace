import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import { CircleCheck, CircleDot, Clock, Hourglass, PackageCheck, XCircle, Ban, Search, HandHeart } from "lucide-react";
import type { ReactNode } from "react";

/** Selectable pill. Selected state is shown by fill and a check-free ring, never colour alone: the text weight also changes. */
export function Chip({
  selected,
  onClick,
  children,
  icon,
  testid,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  testid?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={testid}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors duration-150 active:scale-[0.97]",
        selected
          ? "border-ultra bg-ultra font-bold text-on-ultra"
          : "border-rule bg-surface font-normal text-ink hover:bg-ultra-tint",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

type Tone = "lost" | "found" | "review" | "rejected" | "ultra" | "neutral";
const tones: Record<Tone, string> = {
  lost: "bg-lost-tint text-lost-ink",
  found: "bg-found-tint text-found-ink",
  review: "bg-review-tint text-review-ink",
  rejected: "bg-rejected-tint text-rejected-ink",
  ultra: "bg-ultra-tint text-ink",
  neutral: "bg-rule/60 text-ink",
};

export function Pill({ tone = "neutral", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

const itemIcons: Record<string, [ReactNode, Tone]> = {
  OPEN: [<CircleDot key="o" size={13} strokeWidth={1.75} />, "ultra"],
  MATCHED: [<Search key="m" size={13} strokeWidth={1.75} />, "found"],
  CLAIM_PENDING: [<Hourglass key="c" size={13} strokeWidth={1.75} />, "review"],
  RETURNED: [<PackageCheck key="r" size={13} strokeWidth={1.75} />, "found"],
  CLOSED: [<Ban key="x" size={13} strokeWidth={1.75} />, "neutral"],
  EXPIRED: [<Clock key="e" size={13} strokeWidth={1.75} />, "neutral"],
};
export function ItemStatusChip({ status }: { status: string }) {
  const [icon, tone] = itemIcons[status] ?? itemIcons.OPEN;
  return (
    <Pill tone={tone} icon={icon}>
      {copy.status.item[status] ?? status}
    </Pill>
  );
}

const claimIcons: Record<string, [ReactNode, Tone]> = {
  PENDING: [<Clock key="p" size={13} strokeWidth={1.75} />, "ultra"],
  APPROVED: [<CircleCheck key="a" size={13} strokeWidth={1.75} />, "found"],
  FLAGGED: [<Hourglass key="f" size={13} strokeWidth={1.75} />, "review"],
  REJECTED: [<XCircle key="r" size={13} strokeWidth={1.75} />, "rejected"],
  EXPIRED: [<Clock key="e" size={13} strokeWidth={1.75} />, "neutral"],
  COLLECTED: [<HandHeart key="h" size={13} strokeWidth={1.75} />, "found"],
};
export function ClaimStatusChip({ status }: { status: string }) {
  const [icon, tone] = claimIcons[status] ?? claimIcons.PENDING;
  return (
    <Pill tone={tone} icon={icon}>
      {copy.status.claim[status] ?? status}
    </Pill>
  );
}

export function TypeChip({ type }: { type: string }) {
  return (
    <Pill tone={type === "LOST" ? "lost" : "found"}>{copy.type[type]}</Pill>
  );
}
