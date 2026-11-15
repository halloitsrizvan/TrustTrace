"use client";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <p className="font-display text-7xl num text-rejected">500</p>
      <h1 className="font-display text-3xl">{copy.error.title}</h1>
      <p className="text-ink-soft">{copy.error.body}</p>
      <Button size="lg" onClick={reset}>{copy.error.retry}</Button>
    </div>
  );
}
