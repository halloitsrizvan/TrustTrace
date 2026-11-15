"use client";
import { copy } from "@/lib/copy";
import { useAdminStats } from "@/lib/api/hooks";
import { zoneName } from "@/lib/utils";
import { ErrorState, Skel } from "@/components/ui/states";

const a = copy.admin;

function Stat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="rounded-3xl border border-rule bg-surface p-4">
      <dd className="font-display text-4xl num">
        {value}
        {unit ? <span className="ml-1 text-xl text-ink-soft">{unit}</span> : null}
      </dd>
      <dt className="text-ink-soft">{label}</dt>
    </div>
  );
}

export default function AdminDashboard() {
  const q = useAdminStats();
  if (q.isLoading)
    return (
      <div className="space-y-4" role="status" aria-label={copy.states.loading}>
        <Skel className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-24" />)}</div>
        <Skel className="h-72 w-full" />
      </div>
    );
  if (q.isError) return <ErrorState title={a.errorTitle} body={a.errorBody} onRetry={() => q.refetch()} />;
  const s = q.data!;
  const zones = [...new Set(s.hotspots.map((h) => h.zone))];
  const hours = [...new Set(s.hotspots.map((h) => h.hour))].sort((x, y) => x - y);
  const max = Math.max(1, ...s.hotspots.map((h) => h.count));
  const top = Math.max(1, ...s.topFinders.map((f) => f.returns));
  const cell = (z: string, h: number) => s.hotspots.find((x) => x.zone === z && x.hour === h)?.count ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">{a.dashTitle}</h1>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={a.returned} value={s.itemsReturned} />
        <Stat label={a.avgHours} value={s.avgHoursToReturn} unit="h" />
        <Stat label={a.fraud} value={s.fraudBlocked} />
        <Stat label={a.reviews} value={s.openReviews} />
        <Stat label={a.tipConv} value={s.tipConversion} unit="%" />
      </dl>

      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <section aria-labelledby="hs" className="min-w-0 space-y-3">
          <div>
            <h2 id="hs" className="font-display text-2xl">{a.hotspots}</h2>
            <p className="text-ink-soft">{a.hotspotsSub}</p>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-rule bg-surface p-4">
            <div className="grid min-w-[560px] gap-1" style={{ gridTemplateColumns: `120px repeat(${hours.length}, minmax(0, 1fr))` }} role="table" aria-label={a.hotspots}>
              <div />
              {hours.map((h) => <div key={h} className="text-center text-xs text-ink-soft num" role="columnheader">{h}</div>)}
              {zones.map((z) => (
                <div key={z} className="contents" role="row">
                  <div className="truncate pr-2 text-sm" role="rowheader">{zoneName(z)}</div>
                  {hours.map((h) => {
                    const n = cell(z, h);
                    return (
                      <div
                        key={h}
                        role="cell"
                        title={`${zoneName(z)}, ${h}:00, ${n}`}
                        className="grid h-7 place-items-center rounded-[4px] text-[11px] font-bold num"
                        style={{
                          background: `color-mix(in srgb, var(--ultra) ${Math.round((n / max) * 100)}%, var(--paper))`,
                          color: n / max > 0.5 ? "var(--on-ultra)" : "var(--ink)",
                        }}
                      >
                        {n}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="tf" className="space-y-3">
          <h2 id="tf" className="font-display text-2xl">{a.topFinders}</h2>
          <ol className="space-y-3 rounded-3xl border border-rule bg-surface p-4">
            {s.topFinders.map((f, i) => (
              <li key={f.id}>
                <div className="flex justify-between text-sm"><span><span className="num">{i + 1}</span>. {f.name}</span><span className="font-bold num">{f.returns}</span></div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-rule/70"><div className="h-full rounded-full bg-ultra" style={{ width: `${(f.returns / top) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
