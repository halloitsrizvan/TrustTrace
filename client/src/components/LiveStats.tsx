"use client";
import { usePublicStats } from "@/lib/api/hooks";
import { copy } from "@/lib/copy";

/** Hidden entirely when the stats endpoint is not available. */
export function LiveStats() {
  const { data } = usePublicStats();
  if (!data) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
      <dl className="flex flex-wrap gap-x-12 gap-y-4 border-y border-rule py-6">
        <div>
          <dd className="font-display text-5xl num">{data.itemsReturned}</dd>
          <dt className="text-ink-soft">{copy.landing.returned}</dt>
        </div>
      </dl>
    </section>
  );
}
