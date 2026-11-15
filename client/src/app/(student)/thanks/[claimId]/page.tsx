"use client";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import { ApiError } from "@/lib/api/client";
import { confirmTip, createTip, useTipEligibility } from "@/lib/api/hooks";
import { rupees } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ErrorState, Skel } from "@/components/ui/states";
import { Stamp } from "@/components/tag/Stamp";

const t = copy.tip;
const MOCK_PAY = process.env.NEXT_PUBLIC_MOCK_PAYMENT === "1";

export default function ThanksPage({ params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const elig = useTipEligibility(claimId);
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [anon, setAnon] = useState(false);
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const attempt = useRef<{ sig: string; key: string } | null>(null);

  const close = () => router.replace("/board");
  const e = elig.data;
  const paise = custom.trim() ? Math.round(Number(custom) * 100) : amount;

  async function send() {
    if (busy || !e) return;
    if (!paise || !Number.isFinite(paise) || paise < e.minAmount || paise > e.maxAmount) {
      setErr(t.amountInvalid);
      return;
    }
    setErr(undefined);
    setBusy(true);
    // One key per payload; a retry of the same payload reuses it.
    const sig = `${paise}|${note}|${anon}`;
    if (attempt.current?.sig !== sig) attempt.current = { sig, key: crypto.randomUUID() };
    try {
      const tip = await createTip({ claimId, amount: paise, note: note.trim() || undefined, anonymous: anon }, attempt.current.key);
      if (tip.status !== "CONFIRMED" && MOCK_PAY) await confirmTip(tip.id);
      qc.invalidateQueries({ queryKey: ["tip-elig", claimId] });
      qc.invalidateQueries({ queryKey: ["tips"] });
      toast.success(copy.toast.thanksSent);
      setDone(true);
    } catch (x) {
      if (x instanceof ApiError && x.status === 409) {
        setErr(t.already);
        qc.invalidateQueries({ queryKey: ["tip-elig", claimId] });
      } else setErr(t.failed);
    } finally {
      setBusy(false);
    }
  }

  let body;
  if (elig.isLoading) body = <Skel className="h-48 w-full" />;
  else if (elig.isError || !e) body = <ErrorState title={t.loadFailed} onRetry={() => elig.refetch()} />;
  else if (done)
    body = (
      <div className="flex flex-col items-center gap-3 py-4 text-center" data-testid="tip-done">
        <Stamp kind="verified" size={110} />
        <p className="font-display text-2xl">{t.sent}</p>
        <p className="text-ink-soft">{t.sentBody}</p>
        <Button onClick={close}>{copy.action.close}</Button>
      </div>
    );
  else if (!e.eligible)
    body = (
      <div className="space-y-4">
        <p>{e.reason === "ALREADY_TIPPED" ? t.already : t.ineligible}</p>
        <Button variant="secondary" onClick={close}>{copy.action.close}</Button>
      </div>
    );
  else
    body = (
      <div className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold">{t.amounts}</legend>
          <div className="flex flex-wrap gap-2">
            {e.suggestedAmounts.map((a) => (
              <Chip key={a} selected={!custom && amount === a} onClick={() => { setAmount(a); setCustom(""); setErr(undefined); }} testid={`tip-amount-${a / 100}`}>
                {rupees(a)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Field label={t.custom} hint={t.range(rupees(e.minAmount), rupees(e.maxAmount))} error={err === t.amountInvalid ? err : undefined}>
          {(p) => <Input {...p} inputMode="numeric" value={custom} onChange={(ev) => setCustom(ev.target.value.replace(/[^0-9.]/g, ""))} data-testid="tip-custom" />}
        </Field>
        <Field label={t.note} right={<span className="text-sm text-ink-soft num">{t.noteCount(note.length)}</span>}>
          {(p) => <Textarea {...p} value={note} maxLength={140} onChange={(ev) => setNote(ev.target.value)} className="min-h-20" />}
        </Field>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" role="switch" checked={anon} onChange={(ev) => setAnon(ev.target.checked)} className="size-5 accent-[var(--ultra)]" />
          <span>
            <span className="block font-bold">{t.anonymous}</span>
            <span className="block text-sm text-ink-soft">{t.anonymousHint}</span>
          </span>
        </label>
        {err && err !== t.amountInvalid ? <p role="alert" className="rounded-[12px] bg-rejected-tint p-3 text-sm font-bold text-rejected-ink">{err}</p> : null}
        <div className="flex gap-3">
          <Button size="lg" className="flex-1" onClick={send} disabled={busy} data-testid="tip-send">{copy.action.sendThanks}</Button>
          <Button size="lg" variant="secondary" className="flex-1" onClick={close} disabled={busy}>{copy.action.notNow}</Button>
        </div>
      </div>
    );

  return (
    <BottomSheet open onOpenChange={(o) => !o && close()} title={t.title} description={e?.eligible && !done ? t.lead : undefined} testid="thanks-sheet">
      {body}
    </BottomSheet>
  );
}
