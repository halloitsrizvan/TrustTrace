"use client";
import Link from "next/link";
import { copy } from "@/lib/copy";
import { useMyClaims } from "@/lib/api/hooks";
import { ticketNo, timeAgo } from "@/lib/utils";
import { MyTabs } from "@/components/MyTabs";
import { Button } from "@/components/ui/button";
import { ClaimStatusChip } from "@/components/ui/chip";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { Stamp, type StampKind } from "@/components/tag/Stamp";

const stampFor: Record<string, StampKind | undefined> = { APPROVED: "verified", COLLECTED: "verified", FLAGGED: "review", REJECTED: "rejected" };

export default function ClaimsPage() {
  const q = useMyClaims();
  const m = copy.my;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl">{m.claimsTitle}</h1>
      <MyTabs />
      {q.isLoading ? (
        <ListSkeleton />
      ) : q.isError ? (
        <ErrorState title={m.errorTitle} body={m.errorBody} onRetry={() => q.refetch()} />
      ) : q.data!.length === 0 ? (
        <EmptyState title={m.claimsEmptyTitle} body={m.claimsEmptyBody} action={<Button href="/board">{copy.action.seeBoard}</Button>} />
      ) : (
        <ul className="space-y-3" data-testid="claims-list">
          {q.data!.map((c) => {
            const s = stampFor[c.status];
            return (
              <li key={c.id}>
                <Link href={`/claim/${c.id}`} className="flex items-center gap-3 rounded-3xl border border-rule bg-surface p-4 hover:bg-ultra-tint">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-display text-lg">{c.foundItem.title}</p>
                    <p className="text-sm text-ink-soft"><span className="num">{ticketNo(c.foundItem.id)}</span>, {timeAgo(c.createdAt)}</p>
                    <ClaimStatusChip status={c.status} />
                  </div>
                  {s ? <Stamp kind={s} size={64} tilt={-8} /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
