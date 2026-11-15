"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Clock, UserRound, Archive } from "lucide-react";
import { copy } from "@/lib/copy";
import { ApiError } from "@/lib/api/client";
import { startClaim, useCloseItem, useItem, useItemMatches, useMe } from "@/lib/api/hooks";
import type { OwnerItem } from "@/lib/api/types";
import { ticketNo, timeAgo, zoneName } from "@/lib/utils";
import { ItemPhoto } from "@/components/tag/ItemPhoto";
import { ItemStatusChip, TypeChip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/sheet";
import { EmptyState, ErrorState, Skel } from "@/components/ui/states";
import { MatchList } from "@/components/MatchList";

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const me = useMe();
  const item = useItem(id);
  const it = item.data;
  const mine = !!it && me.data?.id === it.reporterId;
  const matches = useItemMatches(id, mine);
  const close = useCloseItem();
  const [confirm, setConfirm] = useState(false);
  const [claiming, setClaiming] = useState(false);

  async function claim() {
    if (claiming) return;
    setClaiming(true);
    try {
      const r = await startClaim(id);
      router.push(`/claim/${r.claimId}`);
    } catch (e) {
      toast.error(e instanceof ApiError && e.message ? e.message : copy.claim.startFailed);
      setClaiming(false);
    }
  }

  if (item.isLoading)
    return (
      <div className="mx-auto max-w-2xl space-y-4" role="status" aria-label={copy.states.loading}>
        <Skel className="aspect-[4/3] w-full" />
        <Skel className="h-8 w-2/3" />
        <Skel className="h-5 w-1/2" />
      </div>
    );
  if (item.isError) {
    const nf = (item.error as ApiError).status === 404;
    return nf ? (
      <EmptyState title={copy.item.notFoundTitle} body={copy.item.notFoundBody} action={<Button href="/board">{copy.action.seeBoard}</Button>} />
    ) : (
      <ErrorState title={copy.item.errorTitle} body={copy.item.errorBody} onRetry={() => item.refetch()} />
    );
  }
  if (!it) return null;

  const lost = it.type === "LOST";
  const open = it.status === "OPEN";
  const privateDetails = mine ? (it as OwnerItem).private?.privateDetails : null;

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <div className={`overflow-hidden rounded-2xl border-l-8 ${lost ? "border-lost" : "border-found"} printed bg-surface p-4 md:p-5`}>
        <ItemPhoto src={it.imageUrl} category={it.category} alt={`${it.title}, ${copy.type[it.type].toLowerCase()} item`} priority />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TypeChip type={it.type} />
          <ItemStatusChip status={it.status} />
          <span className="ml-auto font-display text-base num">{ticketNo(it.id)}</span>
        </div>
        <h1 className="mt-3 font-display text-3xl">{it.title}</h1>
        <ul className="mt-3 space-y-1.5 text-ink-soft">
          <li className="flex items-center gap-2"><MapPin size={17} strokeWidth={1.75} aria-hidden />{zoneName(it.zone)}{it.eventTag ? `, ${it.eventTag}` : ""}</li>
          <li className="flex items-center gap-2"><Clock size={17} strokeWidth={1.75} aria-hidden />{timeAgo(it.occurredAt)}</li>
          <li className="flex items-center gap-2"><UserRound size={17} strokeWidth={1.75} aria-hidden />{copy.item.reportedBy} {it.reporter.name}</li>
          {it.holdLocation ? <li className="flex items-center gap-2"><Archive size={17} strokeWidth={1.75} aria-hidden />{copy.item.holdAt} {it.holdLocation}</li> : null}
        </ul>
        <p className="measure mt-4 whitespace-pre-line">{it.publicDescription}</p>
        {privateDetails ? (
          <p className="mt-4 rounded-2xl bg-ultra-tint p-3 text-sm">{privateDetails}</p>
        ) : null}
      </div>

      {!mine && !lost && open ? (
        <div className="space-y-2">
          {me.data ? (
            <Button size="lg" className="w-full" onClick={claim} disabled={claiming} data-testid="claim-start">
              {copy.action.claim}
            </Button>
          ) : (
            <Button size="lg" className="w-full" href={`/login?next=/items/${id}`}>
              {copy.item.signInToClaim}
            </Button>
          )}
          <p className="text-center text-sm text-ink-soft">{copy.item.claimNote}</p>
        </div>
      ) : null}

      {mine ? (
        <section className="space-y-4" aria-labelledby="pm">
          <h2 id="pm" className="font-display text-2xl">{copy.item.possibleMatches}</h2>
          {matches.isLoading ? (
            <Skel className="h-40 w-full" />
          ) : matches.isError ? (
            <ErrorState title={copy.item.errorTitle} body={copy.item.errorBody} onRetry={() => matches.refetch()} />
          ) : (matches.data ?? []).length === 0 ? (
            <EmptyState title={copy.item.noMatches} body={copy.item.noMatchesBody} />
          ) : (
            <MatchList matches={matches.data!} />
          )}
          {open ? (
            <Button variant="secondary" onClick={() => setConfirm(true)} data-testid="close-report">
              {copy.action.closeReport}
            </Button>
          ) : null}
        </section>
      ) : null}

      <BottomSheet open={confirm} onOpenChange={setConfirm} title={copy.action.closeReport} description={copy.item.closeConfirm}>
        <div className="flex gap-3">
          <Button
            variant="danger"
            className="flex-1"
            disabled={close.isPending}
            onClick={() =>
              close.mutate(id, {
                onSuccess: () => {
                  toast.success(copy.item.closed);
                  router.replace("/items/mine");
                },
                onError: () => toast.error(copy.states.errorDefaultBody),
              })
            }
          >
            {copy.action.closeReport}
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setConfirm(false)}>
            {copy.action.cancel}
          </Button>
        </div>
      </BottomSheet>
    </article>
  );
}
