"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { copy } from "@/lib/copy";
import { scanToken } from "@/lib/api/hooks";
import type { HandoverResult } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const a = copy.admin;
const REGION = "qr-region";
const failText = { USED: a.used, EXPIRED: a.expired, INVALID: a.invalid } as const;

export default function ScanPage() {
  const [result, setResult] = useState<HandoverResult | null>(null);
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");
  const [camError, setCamError] = useState(false);
  const [busy, setBusy] = useState(false);
  const last = useRef<{ t: string; at: number }>({ t: "", at: 0 });
  const scanner = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  const check = useCallback(async (token: string, manual = false) => {
    const now = Date.now();
    // Debounce repeat decodes of the same code for 1.5s.
    if (!manual && last.current.t === token && now - last.current.at < 1500) return;
    last.current = { t: token, at: now };
    setBusy(true);
    try {
      setResult(await scanToken(token.trim()));
    } catch {
      setResult({ ok: false, code: undefined });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (manual || result) return;
    let dead = false;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (dead) return;
        const s = new Html5Qrcode(REGION);
        scanner.current = s;
        await s.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, (txt) => check(txt), () => {});
      } catch {
        if (!dead) setCamError(true);
      }
    })();
    return () => {
      dead = true;
      const s = scanner.current;
      scanner.current = null;
      try {
        // stop() throws synchronously when the camera never started
        s?.stop().then(() => s.clear()).catch(() => {});
      } catch {
        try { s?.clear(); } catch {}
      }
    };
  }, [manual, result, check]);

  function again() {
    setResult(null);
    setCode("");
    setCamError(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl">{a.scanTitle}</h1>

      {result ? (
        <div
          role="status"
          data-testid="scan-result"
          data-ok={result.ok}
          className={`space-y-4 rounded-3xl p-8 text-center ${result.ok ? "bg-found-tint text-found-ink" : "bg-rejected-tint text-rejected-ink"}`}
        >
          {result.ok ? <CircleCheck className="mx-auto" size={64} strokeWidth={1.75} aria-hidden /> : <CircleX className="mx-auto" size={64} strokeWidth={1.75} aria-hidden />}
          {result.ok ? (
            <>
              <p className="font-display text-4xl">{a.handedOver}</p>
              <p className="text-xl">{result.itemTitle}</p>
              <p className="text-lg">{a.owner}: {result.ownerFirstName}</p>
            </>
          ) : (
            <p className="font-display text-3xl">{result.code ? failText[result.code] : copy.admin.scanFailed}</p>
          )}
          <Button size="lg" onClick={again} data-testid="scan-again">{copy.action.scanAgain}</Button>
        </div>
      ) : manual ? (
        <form
          onSubmit={(e) => { e.preventDefault(); if (code.trim() && !busy) check(code, true); }}
          className="space-y-4 rounded-3xl border border-rule bg-surface p-5"
        >
          <Field label={a.scanManual}>{(p) => <Input {...p} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" data-testid="scan-code" />}</Field>
          <div className="flex gap-3">
            <Button type="submit" size="lg" disabled={busy || !code.trim()} data-testid="scan-check">{copy.action.checkCode}</Button>
            <Button variant="secondary" size="lg" onClick={() => setManual(false)}>{copy.action.useCamera}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-ink">
            <div id={REGION} className="min-h-[320px] w-full" />
            <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="size-60 rounded-3xl border-4 border-white/90" />
            </div>
          </div>
          <p className="text-center text-ink-soft">{camError ? a.cameraDenied : a.scanHint}</p>
          <div className="text-center">
            <Button variant="secondary" onClick={() => setManual(true)} data-testid="scan-manual">{copy.action.enterCode}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
