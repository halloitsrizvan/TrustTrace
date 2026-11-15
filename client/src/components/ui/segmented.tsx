"use client";
import { cn } from "@/lib/utils";

/** Segmented control as a radio group. Arrow keys move the selection. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  testid,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  testid?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-testid={testid}
      className="inline-flex rounded-2xl border border-rule bg-surface p-1"
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const n = options[(i + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length];
                onChange(n.value);
                (e.currentTarget.parentElement?.children[options.indexOf(n)] as HTMLElement)?.focus();
              }
            }}
            className={cn(
              "min-h-10 min-w-16 rounded-full px-4 text-sm transition-colors duration-150",
              on ? "bg-ultra font-bold text-on-ultra" : "text-ink hover:bg-ultra-tint",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
