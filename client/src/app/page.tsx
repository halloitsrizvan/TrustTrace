import Link from "next/link";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shell/Logo";
import { TagCard } from "@/components/tag/TagCard";
import { LiveStats } from "@/components/LiveStats";
import { LandingAuthLink } from "@/components/LandingAuthLink";
import type { PublicItem } from "@/lib/api/types";

const sample = (id: string, type: "LOST" | "FOUND", title: string): PublicItem => ({
  id, type, status: "OPEN", category: "PHONE", title, publicDescription: "", zone: "LIBRARY",
  eventTag: null, occurredAt: "2026-11-14T10:00:00.000Z", imageUrl: null, reporterId: "x", holdLocation: null,
  createdAt: "", updatedAt: "", reporter: { id: "x", name: "" },
});

export default function Landing() {
  const c = copy.landing;
  return (
    <div className="relative isolate">
      <div aria-hidden className="bg-hero absolute inset-x-0 top-0 -z-10 h-[640px]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <Logo />
        <nav aria-label={copy.nav.main} className="flex items-center gap-1">
          <Link href="/board" className="inline-flex min-h-11 items-center rounded-2xl px-3">
            {copy.nav.board}
          </Link>
          <LandingAuthLink />
        </nav>
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-8 md:grid-cols-[1.05fr_1fr] md:gap-8 md:px-6 md:pt-14">
          <div className="space-y-6">
            <h1 className="font-display text-4xl md:text-6xl">{c.title}</h1>
            <p className="measure text-lg text-ink-soft">{c.sub}</p>
            <div className="flex flex-wrap gap-3">
              <Button href="/report/lost" variant="lost" size="lg">
                {copy.action.reportLost}
              </Button>
              <Button href="/report/found" variant="found" size="lg">
                {copy.action.reportFound}
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md pt-10" aria-hidden>
            <svg className="absolute inset-x-0 top-0 h-14 w-full text-ink-soft" viewBox="0 0 100 30" preserveAspectRatio="none" fill="none">
              <path d="M9 29 Q50 -8 91 29" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-ultra px-3 py-1 font-display text-base text-on-ultra num">
              {c.match}
            </span>
            <div className="grid grid-cols-2 gap-5">
              <TagCard decorative item={sample("a0000000-0000-4000-8000-000000000412", "LOST", c.lostTag)} />
              <div className="mt-6">
                <TagCard decorative item={sample("a0000000-0000-4000-8000-000000000413", "FOUND", c.foundTag)} />
              </div>
            </div>
          </div>
        </section>

        <LiveStats />

        <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
          <h2 className="font-display text-3xl">{c.stepsTitle}</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {c.steps.map((s, i) => (
              <li key={s.t} className="rounded-3xl border border-rule bg-surface p-5">
                <span className="font-display text-4xl text-ultra num">{i + 1}</span>
                <h3 className="mt-2 font-display text-xl">{s.t}</h3>
                <p className="mt-1 text-ink-soft">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
