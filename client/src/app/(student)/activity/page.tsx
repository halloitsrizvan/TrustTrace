"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { copy } from "@/lib/copy";
import { cn, timeAgo } from "@/lib/utils";
import { useCloseItem, useMyClaims, useMyItems } from "@/lib/api/hooks";
import type { OwnerItem } from "@/lib/api/types";
import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ClaimStatusChip, ItemStatusChip } from "@/components/ui/chip";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";
import { SkeletonTag, TagCard } from "@/components/tag/TagCard";
import { Stamp, type StampKind } from "@/components/tag/Stamp";

const stampFor: Record<string, StampKind | undefined> = { APPROVED: "verified", COLLECTED: "verified", FLAGGED: "review", REJECTED: "rejected" };
const m = copy.my;

// Only reports that are not mid-claim or already returned can be deleted.
const deletable = (i: OwnerItem) => ["OPEN", "MATCHED", "EXPIRED"].includes(i.status);

function Reports() {
  const q = useMyItems();
  const close = useCloseItem();
  const [target, setTarget] = useState<OwnerItem | null>(null);
  const rows = (q.data ?? []).filter((i) => i.status !== "CLOSED");
  if (q.isLoading)
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 xl:grid-cols-4">
        <SkeletonTag /><SkeletonTag /><SkeletonTag />
      </div>
    );
  if (q.isError) return <ErrorState title={m.errorTitle} body={m.errorBody} onRetry={() => q.refetch()} />;
  if (rows.length === 0)
    return <EmptyState title={m.reportsEmptyTitle} body={m.reportsEmptyBody} action={<Button href="/report/lost">{copy.action.reportLost}</Button>} />;
  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4" data-testid="my-items">
        {rows.map((i) => (
          <div key={i.id} className="space-y-1.5">
            <TagCard item={i} testid="my-item" />
            <div className="flex items-center justify-between gap-2 px-1">
              {i.status !== "OPEN" ? <ItemStatusChip status={i.status} /> : <span />}
              {deletable(i) ? (
                <button
                  type="button"
                  onClick={() => setTarget(i)}
                  aria-label={`${copy.action.delete}: ${i.title}`}
                  data-testid="delete-report"
                  className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors duration-150 hover:text-rejected"
                >
                  <Trash2 size={18} strokeWidth={1.75} aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <BottomSheet open={!!target} onOpenChange={(o) => !o && setTarget(null)} title={m.deleteTitle} description={target ? m.deleteBody(target.title) : undefined}>
        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            disabled={close.isPending}
            data-testid="confirm-delete"
            onClick={() =>
              target &&
              close.mutate(target.id, {
                onSuccess: () => {
                  toast.success(m.deleted);
                  setTarget(null);
                  q.refetch();
                },
                onError: () => toast.error(m.deleteFailed),
              })
            }
          >
            {copy.action.delete}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setTarget(null)}>{copy.action.cancel}</Button>
        </div>
      </BottomSheet>
    </>
  );
}

function Claims() {
  const q = useMyClaims();
  if (q.isLoading) return <ListSkeleton />;
  if (q.isError) return <ErrorState title={m.errorTitle} body={m.errorBody} onRetry={() => q.refetch()} />;
  if (q.data!.length === 0)
    return <EmptyState title={m.claimsEmptyTitle} body={m.claimsEmptyBody} action={<Button href="/board">{copy.action.seeBoard}</Button>} />;
  return (
    <ul className="space-y-3" data-testid="claims-list">
      {q.data!.map((c) => {
        const s = stampFor[c.status];
        return (
          <li key={c.id}>
            <Link href={`/claim/${c.id}`} className="printed flex items-center gap-3 rounded-3xl bg-surface p-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate font-display text-lg">{c.foundItem.title}</p>
                <p className="text-sm text-ink-soft">{timeAgo(c.createdAt)}</p>
                <ClaimStatusChip status={c.status} />
              </div>
              {s ? <Stamp kind={s} size={64} tilt={-8} /> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Activity() {
  const tab = useSearchParams().get("tab") === "claims" ? "claims" : "reports";
  const path = usePathname();
  const tabs = [
    { value: "reports", label: m.tabReports },
    { value: "claims", label: m.tabClaims },
  ];
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div role="tablist" aria-label={copy.nav.activity} className="flex gap-6 border-b border-rule">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={t.value === "reports" ? path : `${path}?tab=claims`}
            replace
            role="tab"
            aria-selected={tab === t.value}
            className={cn(
              "-mb-px inline-flex min-h-11 items-center border-b-2 text-base transition-colors duration-150",
              tab === t.value ? "border-ultra font-bold text-ink" : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {tab === "reports" ? <Reports /> : <Claims />}
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense>
      <Activity />
    </Suspense>
  );
}
