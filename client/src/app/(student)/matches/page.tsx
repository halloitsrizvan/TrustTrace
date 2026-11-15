"use client";
import { useQueries } from "@tanstack/react-query";
import { copy } from "@/lib/copy";
import { get } from "@/lib/api/client";
import { keys, useMyItems } from "@/lib/api/hooks";
import type { ItemMatch } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { MatchList } from "@/components/MatchList";

export default function MatchesPage() {
  const mine = useMyItems();
  const open = (mine.data ?? []).filter((i) => i.type === "LOST" && i.status === "OPEN");
  const results = useQueries({
    queries: open.map((i) => ({ queryKey: keys.matches(i.id), queryFn: () => get<ItemMatch[]>(`/items/${i.id}/matches`) })),
  });
  const m = copy.my;
  const loading = mine.isLoading || results.some((r) => r.isLoading);
  const groups = open.map((i, n) => ({ item: i, matches: results[n]?.data ?? [] })).filter((g) => g.matches.length);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-3xl">{m.matchesTitle}</h1>
      {loading ? (
        <ListSkeleton />
      ) : mine.isError ? (
        <ErrorState title={m.errorTitle} body={m.errorBody} onRetry={() => mine.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState title={m.matchesEmptyTitle} body={m.matchesEmptyBody} action={<Button href="/report/lost">{copy.action.reportLost}</Button>} />
      ) : (
        groups.map((g) => (
          <section key={g.item.id} className="space-y-3">
            <h2 className="font-display text-xl">{m.forItem(g.item.title)}</h2>
            <MatchList matches={g.matches} />
          </section>
        ))
      )}
    </div>
  );
}
