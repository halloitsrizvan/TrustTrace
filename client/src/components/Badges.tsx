import { copy } from "@/lib/copy";
import type { BadgeCode } from "@/lib/api/types";
import { BadgeSeal } from "@/components/tag/Stamp";

export function Badges({ badges }: { badges: BadgeCode[] }) {
  return (
    <section aria-labelledby="badges-h" className="space-y-3">
      <h2 id="badges-h" className="font-display text-2xl">{copy.profile.badges}</h2>
      {badges.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-rule p-5">
          <p className="font-bold">{copy.profile.noBadges}</p>
          <p className="text-ink-soft">{copy.profile.noBadgesBody}</p>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-5">
          {badges.map((b) => (
            <li key={b} className="w-24">
              <BadgeSeal code={b} size={64} showName />
              <p className="mt-0.5 text-center text-xs text-ink-soft">{copy.badge[b]?.desc}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
