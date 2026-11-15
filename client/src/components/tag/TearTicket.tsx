"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Notches({ edge }: { edge: "top" | "bottom" }) {
  const pos = edge === "top" ? "-top-2.5" : "-bottom-2.5";
  return (
    <>
      <span aria-hidden className={cn("absolute -left-2.5 size-5 rounded-full bg-paper", pos)} />
      <span aria-hidden className={cn("absolute -right-2.5 size-5 rounded-full bg-paper", pos)} />
    </>
  );
}

/** A ticket with a perforated stub. When `torn`, the stub detaches and drops. */
export function TearTicket({
  top,
  stub,
  torn,
  className,
  testid,
}: {
  top: ReactNode;
  stub?: ReactNode;
  torn?: boolean;
  className?: string;
  testid?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative", className)} data-testid={testid}>
      <div className="printed-drop">
        <div className="relative overflow-hidden rounded-t-[28px] bg-surface p-5">
          {top}
          <Notches edge="bottom" />
        </div>
      </div>
      {/* perforation */}
      {!torn ? <div aria-hidden className="perforation relative z-10 mx-3 -mt-px" /> : null}
      {stub ? (
        <motion.div
          initial={false}
          animate={torn ? { y: 24, rotate: 4 } : { y: 0, rotate: 0 }}
          transition={{ duration: reduce ? 0 : 0.6, ease: "easeOut" }}
          style={{ transformOrigin: "0% 0%" }}
          className={cn(torn ? "relative z-0" : "")}
        >
          <div className={torn ? "drop-shadow-[0_12px_14px_rgba(20,26,60,0.22)]" : "printed-drop"}>
            <div className="relative overflow-hidden rounded-b-[28px] bg-surface p-5">
              <Notches edge="top" />
              {stub}
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
