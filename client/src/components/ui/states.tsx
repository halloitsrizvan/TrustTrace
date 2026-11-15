import { AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { copy } from "@/lib/copy";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title = copy.states.emptyDefault,
  body,
  action,
  icon,
}: {
  title?: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-14 text-center">
      <div aria-hidden className="grid size-14 place-items-center rounded-full bg-ultra-tint text-ink">
        {icon ?? <Inbox size={26} strokeWidth={1.75} />}
      </div>
      <h2 className="font-display text-xl">{title}</h2>
      {body ? <p className="text-ink-soft">{body}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = copy.states.errorDefault,
  body = copy.states.errorDefaultBody,
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="mx-auto flex max-w-sm flex-col items-center gap-3 px-4 py-14 text-center">
      <div aria-hidden className="grid size-14 place-items-center rounded-full bg-rejected-tint text-rejected-ink">
        <AlertTriangle size={26} strokeWidth={1.75} />
      </div>
      <h2 className="font-display text-xl">{title}</h2>
      <p className="text-ink-soft">{body}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {copy.action.retry}
        </Button>
      ) : null}
    </div>
  );
}

export function Skel({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skel rounded-[8px]", className)} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label={copy.states.loading} className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skel key={i} className="h-20 w-full rounded-[12px]" />
      ))}
    </div>
  );
}
