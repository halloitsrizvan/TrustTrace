import { copy } from "@/lib/copy";
import type { ItemMatch } from "@/lib/api/types";
import { TagCard } from "@/components/tag/TagCard";

function Bar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 shrink-0 text-ink-soft">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-rule/70" role="meter" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-ultra" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 text-right font-bold num">{pct}%</span>
    </div>
  );
}

export function MatchList({ matches, withBreakdown = true }: { matches: ItemMatch[]; withBreakdown?: boolean }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2" data-testid="match-list">
      {matches.map((m) => (
        <li key={m.item.id} className="space-y-3">
          <TagCard item={m.item} score={m.score} testid="match-item" />
          {withBreakdown ? (
            <div className="space-y-1.5 rounded-[12px] border border-rule bg-surface p-3">
              <Bar label={copy.item.looks} value={m.breakdown.looks} />
              <Bar label={copy.item.area} value={m.breakdown.area} />
              <Bar label={copy.item.time} value={m.breakdown.time} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
