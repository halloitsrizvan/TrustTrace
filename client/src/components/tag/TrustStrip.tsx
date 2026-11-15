"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import type { ScoreBreakdown } from "@/lib/api/types";

const order: (keyof ScoreBreakdown)[] = ["proof", "timeline", "history", "behaviour"];
const fills = [
  "var(--ultra)",
  "color-mix(in srgb, var(--ultra) 72%, var(--surface))",
  "color-mix(in srgb, var(--ultra) 50%, var(--surface))",
  "color-mix(in srgb, var(--ultra) 32%, var(--surface))",
];

/** Score meter. Four stacked segments fill in order; the score counts up. */
export function TrustStrip({
  score,
  breakdown,
  highValue,
  animated = false,
  onDone,
  className,
}: {
  score: number;
  breakdown: ScoreBreakdown;
  highValue?: boolean;
  animated?: boolean;
  onDone?: () => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const run = animated && !reduce;
  const [count, setCount] = useState(0);
  const shown = run ? count : score;
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    if (!run) {
      const t = setTimeout(() => done.current?.(), 0);
      return () => clearTimeout(t);
    }
    const c = animate(0, score, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setCount(Math.round(v)),
    });
    return () => c.stop();
  }, [run, score]);

  const vals = order.map((k) => Math.max(0, breakdown[k]));
  const segs = order.map((k, i) => ({ k, v: vals[i], left: vals.slice(0, i).reduce((a, b) => a + b, 0), i }));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <span className="text-sm font-bold text-ink-soft">{copy.claim.scoreLabel}</span>
        <span
          data-testid="trust-score"
          aria-hidden
          className="font-display text-5xl num leading-none"
          style={{ fontVariationSettings: '"wdth" 125' }}
        >
          {shown}
          <span className="text-xl text-ink-soft">/100</span>
        </span>
      </div>

      <div className="relative pb-6 pt-2">
        <div className="relative h-3.5 overflow-hidden rounded-full bg-rule/70" role="presentation">
          {segs.map((s) => (
            <motion.div
              key={s.k}
              className="absolute inset-y-0 border-r-2 border-surface"
              style={{ left: `${s.left}%`, background: fills[s.i] }}
              initial={{ width: run ? 0 : `${s.v}%` }}
              animate={{ width: `${s.v}%` }}
              transition={{ duration: run ? 0.7 : 0, delay: run ? s.i * 0.12 : 0, ease: "easeOut" }}
              onAnimationComplete={s.i === order.length - 1 && run ? () => done.current?.() : undefined}
            />
          ))}
        </div>
        {/* ticks */}
        {[
          { at: 40, label: copy.claim.tickReview },
          { at: 70, label: copy.claim.tickVerified },
        ].map((t) => (
          <div key={t.at} className="absolute top-0 -translate-x-1/2" style={{ left: `${t.at}%` }} aria-hidden>
            <div className="mx-auto h-[22px] w-0.5 bg-ink" />
            <div className="mt-0.5 whitespace-nowrap text-center text-xs font-bold text-ink num">
              {t.at} {t.label}
            </div>
          </div>
        ))}
        {highValue ? (
          <div className="absolute top-0 -translate-x-1/2" style={{ left: "75%" }} aria-hidden>
            <div className="mx-auto h-[22px] w-0.5 border-l-2 border-dashed border-ink" />
          </div>
        ) : null}
      </div>

      {highValue ? <p className="text-sm text-ink-soft">{copy.claim.tickHigh}</p> : null}

      <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
        {segs.map((s) => (
          <li key={s.k} className="flex items-center gap-2">
            <span aria-hidden className="size-3 shrink-0 rounded-[3px]" style={{ background: fills[s.i] }} />
            <span className="text-ink">{copy.claim.legend[s.k]}</span>
            <span className="ml-auto font-bold num">{s.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
