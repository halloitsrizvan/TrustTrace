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
  const maxZone = Math.max(1, ...s.zones.map((z) => z.count));
  const hourCount = (h: number) => s.hours.find((x) => Number(x.key) === h)?.count ?? 0;
  const maxHour = Math.max(1, ...s.hours.map((x) => x.count));
  const top = Math.max(1, ...s.topFinders.map((f) => f.returns));

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
        <section aria-labelledby="hs" className="min-w-0 space-y-6">
          <div>
            <h2 id="hs" className="font-display text-2xl">{a.hotspots}</h2>
            <p className="text-ink-soft">{a.hotspotsSub}</p>
          </div>
          <div className="space-y-3 rounded-3xl border border-rule bg-surface p-5">
            <h3 className="font-display text-lg">{a.byZone}</h3>
            <ul className="space-y-2">
              {s.zones.map((z) => (
                <li key={z.key} className="grid grid-cols-[130px_1fr_32px] items-center gap-3 text-sm">
                  <span className="truncate">{zoneName(z.key)}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-rule/70"><span className="block h-full rounded-full bg-ultra" style={{ width: `${(z.count / maxZone) * 100}%` }} /></span>
                  <span className="text-right font-bold num">{z.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 rounded-3xl border border-rule bg-surface p-5">
            <h3 className="font-display text-lg">{a.byHour}</h3>
            <div className="grid grid-cols-12 gap-1 sm:grid-cols-24" role="list" aria-label={a.byHour}>
              {Array.from({ length: 24 }, (_, h) => {
                const n = hourCount(h);
                return (
                  <div
                    key={h}
                    role="listitem"
                    title={`${h}:00, ${n}`}
                    className="grid h-10 place-items-center rounded-lg text-[11px] font-bold num"
                    style={{
                      background: `color-mix(in srgb, var(--ultra) ${Math.round((n / maxHour) * 100)}%, var(--paper))`,
                      color: n / maxHour > 0.5 ? "var(--on-ultra)" : "var(--ink)",
                    }}
                  >
                    {h}
                  </div>
                );
              })}
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
