"use client";
import { useRouter } from "next/navigation";
import { BadgeCheck, HandHeart, Heart, PackageCheck, Search, ShieldCheck } from "lucide-react";
import { copy } from "@/lib/copy";
import { useMarkRead, useNotifications } from "@/lib/api/hooks";
import type { AppNotification } from "@/lib/api/types";
import { cn, timeAgo } from "@/lib/utils";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";

const icons: Record<AppNotification["type"], typeof Search> = {
  MATCH_FOUND: Search,
  CLAIM_RESULT: ShieldCheck,
  HANDOVER_DONE: PackageCheck,
  TIP_PROMPT: HandHeart,
  TIP_RECEIVED: Heart,
  BADGE_EARNED: BadgeCheck,
};

function target(n: AppNotification) {
  switch (n.type) {
    case "MATCH_FOUND": return n.data?.itemId ? `/items/${n.data.itemId}` : "/matches";
    case "CLAIM_RESULT":
    case "HANDOVER_DONE": return n.data?.claimId ? `/claim/${n.data.claimId}` : "/claims";
    case "TIP_PROMPT": return n.data?.claimId ? `/thanks/${n.data.claimId}` : "/claims";
    default: return "/me";
  }
}

export default function NotificationsPage() {
  const q = useNotifications();
  const read = useMarkRead();
  const router = useRouter();
  const n = copy.notif;
  const list = q.data ?? [];
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl">{n.title}</h1>
      {q.isLoading ? (
        <ListSkeleton />
      ) : q.isError ? (
        <ErrorState title={n.errorTitle} body={n.errorBody} onRetry={() => q.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title={n.emptyTitle} body={n.emptyBody} />
      ) : (
        <ul className="space-y-2" data-testid="notifications">
          {list.map((x) => {
            const Icon = icons[x.type] ?? Search;
            return (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!x.readAt) read.mutate(x.id);
                    router.push(target(x));
                  }}
                  className="flex min-h-16 w-full items-start gap-3 rounded-[14px] border border-rule bg-surface p-4 text-left hover:bg-ultra-tint"
                >
                  <span aria-hidden className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-ultra-tint">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block", !x.readAt && "font-bold")}>{x.title}</span>
                    <span className="block text-ink-soft">{x.body}</span>
                    <span className="block text-sm text-ink-soft">{timeAgo(x.createdAt)}</span>
                  </span>
                  {!x.readAt ? (
                    <span className="mt-2 flex items-center gap-1 text-xs font-bold text-ultra">
                      <span aria-hidden className="size-2.5 rounded-full bg-lost" />
                      <span className="sr-only">{n.unread}</span>
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
