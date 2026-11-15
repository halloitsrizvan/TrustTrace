"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { CalendarClock, Download, RefreshCw } from "lucide-react";
import { copy } from "@/lib/copy";
import { ApiError } from "@/lib/api/client";
import { fetchQr, keys, startClaim, submitClaim, useClaim } from "@/lib/api/hooks";
import type { Claim, ClaimSubmitResult } from "@/lib/api/types";
import { HIGH_VALUE, ticketNo } from "@/lib/utils";
import { TearTicket } from "@/components/tag/TearTicket";
import { TrustStrip } from "@/components/tag/TrustStrip";
import { Stamp } from "@/components/tag/Stamp";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { ErrorState, Skel } from "@/components/ui/states";

const c = copy.claim;

function useCountdown(iso: string | null | undefined) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!iso) return;
    const tick = () => setLeft(Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [iso]);
  return left;
}
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function QrBlock({ claimId, token, expiresAt, onNew }: { claimId: string; token: string; expiresAt: string; onNew: (t: string, e: string) => void }) {
  const left = useCountdown(expiresAt);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const expired = left === 0;

  function save() {
    const canvas = wrap.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `trusttrace-${claimId.slice(0, 6)}.png`;
    a.click();
    toast.success(copy.toast.saved);
  }
  async function renew() {
    setBusy(true);
    try {
      const q = await fetchQr(claimId);
      onNew(q.handoverToken, q.tokenExpiresAt);
    } catch {
      toast.error(c.qrFailed);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fade-in flex flex-col items-center gap-3 text-center">
      <div ref={wrap} data-testid="claim-qr" className={`rounded-2xl bg-white p-4 ${expired ? "opacity-30" : ""}`}>
        <QRCodeCanvas value={token} size={220} level="M" marginSize={0} bgColor="#ffffff" fgColor="#000000" role="img" aria-label={c.qrAlt} />
      </div>
      <p className="flex items-center gap-1.5 text-sm font-bold num" aria-live="off">
        <CalendarClock size={16} strokeWidth={1.75} aria-hidden />
        {expired ? c.expired : `${c.expiresIn} ${left === null ? "" : mmss(left)}`}
      </p>
      <p className="text-sm text-ink-soft">{c.shownOnce}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="secondary" onClick={save} disabled={expired}>
          <Download size={17} strokeWidth={1.75} aria-hidden /> {copy.action.saveToPhotos}
        </Button>
        <Button variant="ghost" onClick={renew} disabled={busy}>
          <RefreshCw size={17} strokeWidth={1.75} aria-hidden /> {copy.action.newCode}
        </Button>
      </div>
    </div>
  );
}

type Answers = Record<string, string>;

export default function ClaimPage({ params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = use(params);
  const qc = useQueryClient();
  const reduce = useReducedMotion();
  const claimQ = useClaim(claimId);
  const claim = claimQ.data;

  const [fetchedPrompts, setFetchedPrompts] = useState<Claim["prompts"]>();
  const [now] = useState(() => Date.now());
  const [photos, setPhotos] = useState<Record<string, string | null>>({});
  const [result, setResult] = useState<ClaimSubmitResult | null>(null);
  const [fresh, setFresh] = useState(false); // result came from this session: animate
  const [phase, setPhase] = useState<"strip" | "result">("strip");
  const [token, setToken] = useState<{ t: string; e: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadFail, setLoadFail] = useState(false);

  const form = useForm<Answers>({ defaultValues: {}, mode: "onTouched" });
  const { control, handleSubmit, formState } = form;

  // Prompts come with the claim; if the API omits them, start again to fetch them (idempotent).
  useEffect(() => {
    if (!claim || claim.status !== "PENDING") return;
    if (claim.prompts?.length) return;
    startClaim(claim.foundItem.id)
      .then((r) => setFetchedPrompts(r.prompts))
      .catch(() => setLoadFail(true));
  }, [claim]);

  const prompts = claim?.prompts?.length ? claim.prompts : fetchedPrompts;
  const onStripDone = useCallback(() => setPhase("result"), []);

  // Announce the final result once, for screen readers and reduced-motion users.
  const finalDecision = result?.decision;
  const announce =
    !result || phase !== "result"
      ? ""
      : finalDecision === "APPROVED"
        ? c.approvedAria(result.trustScore)
        : finalDecision === "FLAGGED"
          ? c.flaggedAria(result.trustScore)
          : c.rejectedAria(result.trustScore);

  async function submit(values: Answers) {
    if (submitting || !prompts) return;
    setSubmitting(true);
    try {
      const r = await submitClaim(
        claimId,
        prompts.map((p) => ({ promptId: p.id, answer: values[p.id].trim(), ...(photos[p.id] ? { photoUrl: photos[p.id] } : {}) })),
      );
      toast.success(c.submitted);
      if (r.handoverToken && r.tokenExpiresAt) setToken({ t: r.handoverToken, e: r.tokenExpiresAt });
      setFresh(true);
      setPhase("strip");
      setResult(r);
      qc.invalidateQueries({ queryKey: keys.claims });
      qc.invalidateQueries({ queryKey: keys.notifs });
    } catch (e) {
      toast.error(e instanceof ApiError && e.status !== 500 && e.message ? e.message : c.submitFailed);
      setSubmitting(false);
    }
  }

  if (claimQ.isLoading)
    return (
      <div className="mx-auto max-w-xl space-y-3" role="status" aria-label={copy.states.loading}>
        <Skel className="h-72 w-full rounded-3xl" />
      </div>
    );
  if (claimQ.isError || !claim || loadFail)
    return <ErrorState title={c.startErrorTitle} body={c.startFailed} onRetry={() => { setLoadFail(false); claimQ.refetch(); }} />;

  const item = claim.foundItem;
  const high = HIGH_VALUE.includes(item.category);
  // A claim opened again later shows its stored result without the animation.
  const stored: ClaimSubmitResult | null =
    !result && claim.status !== "PENDING" && claim.trustScore != null && claim.breakdown
      ? {
          decision: claim.status === "FLAGGED" ? "FLAGGED" : claim.status === "REJECTED" ? "REJECTED" : "APPROVED",
          trustScore: claim.trustScore,
          breakdown: claim.breakdown,
          attemptsLeft: claim.attemptsLeft,
          retryAfter: claim.retryAfter,
        }
      : null;
  const shown = result ?? stored;
  const showResult = shown && (fresh ? phase === "result" : true);
  const torn = !!(shown && shown.decision === "APPROVED" && showResult && (token || fresh));

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl">{c.title}</h1>
        <p className="mt-1 text-ink-soft">{item.title}</p>
      </div>
      <span className="font-display text-base num">{ticketNo(item.id)}</span>
    </div>
  );

  let top;
  let stub;
  if (!shown) {
    if (claim.status !== "PENDING") {
      top = (
        <div className="space-y-4">
          {header}
          <p>{copy.status.claim[claim.status]}</p>
        </div>
      );
    } else {
      top = (
        <form id="claim-form" onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
          {header}
          <p className="rounded-2xl bg-ultra-tint p-3">{c.why}</p>
          {!prompts ? (
            <Skel className="h-40 w-full" />
          ) : (
            prompts.map((p, i) => (
              <Field key={p.id} label={`${i + 1}. ${p.text}`} hint={p.hint} error={formState.errors[p.id]?.message}>
                {(a) => (
                  <>
                    <Controller
                      control={control}
                      name={p.id}
                      rules={{ validate: (v) => (v ?? "").trim().length >= 3 || c.answerShort }}
                      render={({ field }) => (
                        <Textarea {...a} {...field} value={field.value ?? ""} data-testid={`claim-prompt-${i + 1}`} maxLength={500} />
                      )}
                    />
                    {p.allowPhoto ? (
                      <div className="pt-2">
                        <p className="mb-1 text-sm text-ink-soft">{c.addPhoto}</p>
                        <PhotoPicker value={photos[p.id] ?? null} onChange={(u) => setPhotos((s) => ({ ...s, [p.id]: u }))} />
                      </div>
                    ) : null}
                  </>
                )}
              </Field>
            ))
          )}
          <Button type="submit" size="lg" className="w-full" disabled={submitting || !prompts} data-testid="claim-submit">
            {submitting ? c.submitting : copy.action.submitProof}
          </Button>
        </form>
      );
    }
    stub = <p className="text-center text-sm text-ink-soft">{c.ticketNo} {ticketNo(item.id)}</p>;
  } else {
    const r = shown;
    const retry = r.retryAfter ? new Date(r.retryAfter) : null;
    const retryFuture = retry && retry.getTime() > now;
    top = (
      <div className="space-y-5">
        {header}
        <TrustStrip
          score={r.trustScore}
          breakdown={r.breakdown}
          highValue={high}
          animated={fresh}
          onDone={fresh ? onStripDone : undefined}
        />
        {showResult ? (
          <div data-testid="claim-result" data-decision={r.decision} className="fade-in relative space-y-3 border-t border-rule pt-5">
            <motion.div
              className="absolute -top-7 right-0 origin-center"
              initial={reduce || !fresh ? false : { scale: 1.15, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Stamp kind={r.decision === "APPROVED" ? "verified" : r.decision === "FLAGGED" ? "review" : "rejected"} size={104} tilt={0} />
            </motion.div>
            {r.decision === "APPROVED" ? (
              <p className="font-display text-xl pr-28">{c.approvedTitle}</p>
            ) : r.decision === "FLAGGED" ? (
              <>
                <p className="font-display text-xl pr-36">{c.flaggedTitle}</p>
                <p>{c.flaggedBody}</p>
                <ul className="list-disc space-y-1 pl-5">
                  {c.flaggedNext.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </>
            ) : (
              <>
                <p className="font-display text-xl pr-28">{c.rejectedTitle}</p>
                <p>{c.rejectedBody}</p>
                <p className="font-bold">
                  {typeof r.attemptsLeft === "number" ? (r.attemptsLeft > 0 ? c.attemptsLeft(r.attemptsLeft) : c.noAttempts) : null}{" "}
                  {r.attemptsLeft !== 0 ? (retryFuture ? c.retryAt(retry!.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })) : c.retryNow) : null}
                </p>
              </>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {claim.status === "COLLECTED" ? <Button href={`/thanks/${claimId}`}>{c.thanksPrompt}</Button> : null}
              <Button href="/claims" variant="secondary">{c.backToClaims}</Button>
            </div>
          </div>
        ) : null}
      </div>
    );
    if (r.decision === "APPROVED" && showResult && claim.status !== "COLLECTED") {
      stub = token ? (
        <QrBlock claimId={claimId} token={token.t} expiresAt={token.e} onNew={(t, e) => setToken({ t, e })} />
      ) : (
        <div className="space-y-2 text-center">
          <p className="text-sm text-ink-soft">{c.shownOnce}</p>
          <Button
            onClick={async () => {
              try {
                const q = await fetchQr(claimId);
                setToken({ t: q.handoverToken, e: q.tokenExpiresAt });
              } catch {
                toast.error(c.qrFailed);
              }
            }}
          >
            {c.getCode}
          </Button>
        </div>
      );
    } else {
      stub = <p className="text-center text-sm text-ink-soft">{c.ticketNo} {ticketNo(item.id)}</p>;
    }
  }

  return (
    <div className="mx-auto max-w-xl pb-10">
      <TearTicket top={top} stub={stub} torn={torn} testid="claim-ticket" />
      <p aria-live="polite" role="status" className="sr-only">{announce}</p>
    </div>
  );
}
