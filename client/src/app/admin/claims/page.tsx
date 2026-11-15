"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { copy } from "@/lib/copy";
import { useAdminClaim, useAdminClaims, useDecide } from "@/lib/api/hooks";
import { cn, ticketNo, timeAgo } from "@/lib/utils";
import { TrustStrip } from "@/components/tag/TrustStrip";
import { Button } from "@/components/ui/button";
import { ClaimStatusChip } from "@/components/ui/chip";
import { Field, Textarea } from "@/components/ui/field";
import { EmptyState, ErrorState, ListSkeleton, Skel } from "@/components/ui/states";

const a = copy.admin;

function Panel({ id, onDecided }: { id: string; onDecided: () => void }) {
  const q = useAdminClaim(id);
  const decide = useDecide();
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string>();
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const run = useCallback(
    (decision: "APPROVED" | "REJECTED") => {
      if (!note.trim()) {
        setErr(a.noteRequired);
        noteRef.current?.focus();
        return;
      }
      setErr(undefined);
      decide.mutate(
        { id, decision, note: note.trim() },
        { onSuccess: () => { toast.success(a.decided); setNote(""); onDecided(); }, onError: () => toast.error(a.decideFailed) },
      );
    },
    [decide, id, note, onDecided],
  );

  useEffect(() => {
    function key(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "a") run("APPROVED");
      if (e.key === "r") run("REJECTED");
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [run]);

  if (q.isLoading) return <Skel className="h-96 w-full" />;
  if (q.isError) return <ErrorState title={a.errorTitle} body={a.errorBody} onRetry={() => q.refetch()} />;
  const c = q.data!;
  const total = c.components.reduce((s, x) => s + x.value, 0);
  const bd = Object.fromEntries(c.components.map((x) => [x.key, x.value])) as { proof: number; timeline: number; history: number; behaviour: number };
  const decided = c.status !== "FLAGGED" && c.status !== "PENDING";

  return (
    <div className="space-y-6" data-testid="review-panel">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-2xl">{c.itemTitle}</h2>
        <ClaimStatusChip status={c.status} />
        <span className="ml-auto font-display num">{ticketNo(c.foundItem.id)}</span>
      </div>
      <p className="text-ink-soft">{c.claimantName}, {timeAgo(c.createdAt)}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border-2 border-dashed border-review bg-review-tint p-4 text-review-ink">
          <h3 className="flex items-center gap-1.5 font-display text-lg"><Lock size={16} strokeWidth={1.75} aria-hidden />{a.privateTitle}</h3>
          <p className="text-xs">{a.privateAdminOnly}</p>
          <p className="mt-2 text-ink dark:text-review-ink">{c.privateDetails ?? ""}</p>
        </section>
        <section className="rounded-3xl border border-rule bg-surface p-4">
          <h3 className="font-display text-lg">{a.answersTitle}</h3>
          <dl className="mt-2 space-y-3">
            {c.answers.map((x) => (
              <div key={x.prompt}>
                <dt className="text-sm text-ink-soft">{x.prompt}</dt>
                <dd>{x.answer || "-"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="rounded-3xl border border-rule bg-surface p-4">
        <h3 className="mb-3 font-display text-lg">{a.componentsTitle}</h3>
        <TrustStrip score={total} breakdown={bd} highValue={["PHONE", "GADGET", "ID_CARD", "WALLET"].includes(c.foundItem.category)} />
        <ul className="mt-4 space-y-1.5 border-t border-rule pt-3 text-sm">
          {c.components.map((x) => (
            <li key={x.key} className="flex gap-2">
              <span className="w-24 shrink-0 font-bold num">{x.value} of {x.max}</span>
              <span className="text-ink-soft">{x.reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 font-display text-lg">{a.historyTitle}</h3>
        {c.history.length === 0 ? (
          <p className="text-ink-soft">{a.noHistory}</p>
        ) : (
          <ul className="space-y-1">
            {c.history.map((h) => (
              <li key={h.id} className="flex items-center gap-2 text-sm"><ClaimStatusChip status={h.status} /> {h.itemTitle}, {timeAgo(h.createdAt)}</li>
            ))}
          </ul>
        )}
      </section>

      {!decided ? (
        <section className="space-y-3 border-t border-rule pt-5">
          <Field label={a.noteLabel} error={err}>
            {(p) => <Textarea {...p} ref={noteRef} value={note} onChange={(e) => { setNote(e.target.value); setErr(undefined); }} data-testid="decision-note" />}
          </Field>
          <div className="flex gap-3">
            <Button onClick={() => run("APPROVED")} disabled={decide.isPending} data-testid="approve">{copy.action.approve}</Button>
            <Button variant="danger" onClick={() => run("REJECTED")} disabled={decide.isPending} data-testid="reject">{copy.action.reject}</Button>
          </div>
          <p className="text-sm text-ink-soft">{a.keys}</p>
        </section>
      ) : null}
    </div>
  );
}

export default function AdminClaimsPage() {
  const q = useAdminClaims();
  const rows = q.data ?? [];
  const [sel, setSel] = useState<string | null>(null);
  const idx = rows.findIndex((r) => r.id === sel);

  useEffect(() => {
    function key(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("input,textarea,select") || !rows.length) return;
      if (e.key === "j") setSel(rows[Math.min(rows.length - 1, idx + 1)].id);
      if (e.key === "k") setSel(rows[Math.max(0, idx - 1)].id);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [rows, idx]);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">{a.claimsTitle}</h1>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div>
          {q.isLoading ? (
            <ListSkeleton />
          ) : q.isError ? (
            <ErrorState title={a.errorTitle} body={a.errorBody} onRetry={() => q.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState title={a.queueEmpty} body={a.queueEmptyBody} />
          ) : (
            <ul className="space-y-2" data-testid="claim-queue" aria-label={a.claimsTitle}>
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSel(r.id)}
                    aria-current={sel === r.id}
                    data-testid="claim-row"
                    className={cn("w-full rounded-3xl border p-3 text-left", sel === r.id ? "border-ultra bg-ultra-tint" : "border-rule bg-surface hover:bg-ultra-tint")}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold">{r.itemTitle}</span>
                      <span className="font-display text-xl num">{r.trustScore}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2 text-sm text-ink-soft">
                      <span>{r.claimantName}, {timeAgo(r.createdAt)}</span>
                      <ClaimStatusChip status={r.status} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0">
          {sel ? (
            <Panel key={sel} id={sel} onDecided={() => { q.refetch(); }} />
          ) : (
            <EmptyState title={a.selectClaim} body={a.keys} />
          )}
        </div>
      </div>
    </div>
  );
}
