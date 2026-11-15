import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "w-full min-h-11 rounded-2xl border border-rule bg-surface px-4 py-2.5 text-base text-ink placeholder:text-ink-soft/80 aria-[invalid=true]:border-rejected";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...p },
  ref,
) {
  return <input ref={ref} className={cn(control, className)} {...p} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...p }, ref) {
    return <textarea ref={ref} className={cn(control, "min-h-24 resize-y", className)} {...p} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...p },
  ref,
) {
  return (
    <span className="relative block">
      <select ref={ref} className={cn(control, "appearance-none pr-10", className)} {...p}>
        {children}
      </select>
      <ChevronDown aria-hidden size={18} strokeWidth={1.75} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft" />
    </span>
  );
});

/** Label, control and inline error. The render prop receives ids to wire up aria. */
export function Field({
  label,
  error,
  hint,
  right,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  right?: ReactNode;
  children: (a: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const id = useId();
  const describedby = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold text-ink">
          {label}
        </label>
        {right}
      </div>
      {children({ id, "aria-describedby": describedby, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={`${id}-err`} role="alert" className="text-sm font-bold text-rejected-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
