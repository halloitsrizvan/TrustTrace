import { Check } from "lucide-react";
import { copy } from "@/lib/copy";
import type { ItemMatch } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { TagCard } from "@/components/tag/TagCard";

function Row({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const yes = value >= 0.5;
  return (
    <li className="flex items-center gap-3" aria-label={`${label}: ${pct}%`}>
      <span
        aria-hidden
        className={cn("grid size-6 shrink-0 place-items-center rounded-full", yes ? "bg-ultra text-on-ultra" : "border-2 border-rule")}
      >
        {yes ? <Check size={14} strokeWidth={2.5} /> : null}
      </span>
      <span className="flex-1">{label}</span>
      <span className="num text-sm font-bold text-ink-soft">{pct}%</span>
    </li>
  );
}

export function MatchList({ matches, withBreakdown = true }: { matches: ItemMatch[]; withBreakdown?: boolean }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2" data-testid="match-list">
      {matches.map((m) => (
        <li key={m.item.id} className="space-y-2">
          <TagCard item={m.item} score={m.score} testid="match-item" />
          {withBreakdown ? (
            <ul className="space-y-2 rounded-3xl bg-surface p-4">
              <Row label={copy.item.looks} value={m.breakdown.looks} />
              <Row label={copy.item.area} value={m.breakdown.area} />
              <Row label={copy.item.time} value={m.breakdown.time} />
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
