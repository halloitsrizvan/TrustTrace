"use client";
import Link from "next/link";
import { useState } from "react";
import { copy } from "@/lib/copy";
import { useLeaderboard } from "@/lib/api/hooks";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { Avatar } from "@/components/Avatar";
import { BadgeSeal } from "@/components/tag/Stamp";

type Period = "week" | "month" | "all";

export default function HeroesPage() {
  const [period, setPeriod] = useState<Period>("week");
  const q = useLeaderboard(period);
  const h = copy.heroes;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl">{h.title}</h1>
        <p className="text-ink-soft">{h.sub}</p>
      </div>
      <Segmented
        label={h.title}
        value={period}
        onChange={setPeriod}
        options={[
          { value: "week", label: h.week },
          { value: "month", label: h.month },
          { value: "all", label: h.all },
        ]}
      />
      {q.isLoading ? (
        <ListSkeleton />
      ) : q.isError ? (
        <ErrorState title={h.errorTitle} body={h.errorBody} onRetry={() => q.refetch()} />
      ) : q.data!.length === 0 ? (
        <EmptyState title={h.emptyTitle} body={h.emptyBody} />
      ) : (
        <ol className="space-y-2" data-testid="leaderboard">
          {q.data!.map((r) => (
            <li key={r.id}>
              <Link href={`/u/${r.id}`} className="flex items-center gap-3 rounded-3xl border border-rule bg-surface p-3 hover:bg-ultra-tint">
                <span className="w-8 text-center font-display text-2xl num">{r.rank}</span>
                <Avatar name={r.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{r.name}</span>
                  <span className="block text-sm text-ink-soft"><span className="num">{h.returns(r.returns)}</span>, {h.karma(r.karma)}</span>
                </span>
                <span className="flex -space-x-1">
                  {r.badges.slice(0, 3).map((b) => <BadgeSeal key={b} code={b} size={36} />)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
