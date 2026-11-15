"use client";
import { useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { TagCard, SkeletonTag } from "@/components/tag/TagCard";
import { Stamp, BadgeSeal } from "@/components/tag/Stamp";
import { TrustStrip } from "@/components/tag/TrustStrip";
import { TearTicket } from "@/components/tag/TearTicket";
import { Button } from "@/components/ui/button";
import { Input, Field, Select, Textarea } from "@/components/ui/field";
import { Chip, ClaimStatusChip, ItemStatusChip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { BottomSheet } from "@/components/ui/sheet";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { CategoryChips, ZoneSelect } from "@/components/ui/pickers";
import type { BadgeCode, PublicItem } from "@/lib/api/types";

const now = Date.now();
const mk = (id: string, type: "LOST" | "FOUND", title: string, category: PublicItem["category"], zone: string, h: number): PublicItem => ({
  id, type, status: "OPEN", category, title, publicDescription: "", zone, eventTag: null, occurredAt: new Date(now - h * 3.6e6).toISOString(),
  imageUrl: null, reporterId: "x", holdLocation: null, createdAt: "", updatedAt: "", reporter: { id: "x", name: "Sample" },
});

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-rule pt-6">
      <h2 className="font-display text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  const [seg, setSeg] = useState("all");
  const [sheet, setSheet] = useState(false);
  const [cat, setCat] = useState("PHONE");
  const [zone, setZone] = useState("");
  const [torn, setTorn] = useState(false);
  const badges: BadgeCode[] = ["FIRST_RETURN", "CAMPUS_HERO", "GUARDIAN", "GRATEFUL_SOUL", "GENEROUS"];
  return (
    <PageShell wide>
      <div className="space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-4xl">Design preview</h1>
          <ThemeToggle />
        </header>

        <Block title="Tags">
          <div className="grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-3">
            <TagCard item={mk("a0000000-0000-4000-8000-000000000412", "LOST", "Black phone, cracked corner", "PHONE", "LIBRARY", 2)} />
            <TagCard item={mk("a0000000-0000-4000-8000-000000000413", "FOUND", "Blue lanyard with ID card", "ID_CARD", "ACADEMIC_BLOCK", 5)} score={92} />
            <div className="hidden md:block"><SkeletonTag /></div>
          </div>
        </Block>

        <Block title="Stamps and seals">
          <div className="flex flex-wrap items-center gap-8">
            <Stamp kind="verified" />
            <Stamp kind="review" />
            <Stamp kind="rejected" />
          </div>
          <div className="flex flex-wrap gap-5">
            {badges.map((b) => (
              <BadgeSeal key={b} code={b} showName />
            ))}
          </div>
        </Block>

        <Block title="Trust strip">
          <div className="grid max-w-3xl gap-8 md:grid-cols-2">
            <div className="rounded-[14px] bg-surface p-5 printed">
              <TrustStrip score={82} highValue breakdown={{ proof: 44, timeline: 16, history: 14, behaviour: 8 }} />
            </div>
            <div className="rounded-[14px] bg-surface p-5 printed">
              <TrustStrip score={18} breakdown={{ proof: 0, timeline: 4, history: 8, behaviour: 6 }} />
            </div>
          </div>
        </Block>

        <Block title="Tear ticket">
          <div className="max-w-sm space-y-3">
            <TearTicket torn={torn} top={<p className="font-display text-xl">Prove it&apos;s yours</p>} stub={<p>Stub content</p>} />
            <Button variant="secondary" onClick={() => setTorn((t) => !t)}>
              {torn ? "Reset" : "Tear"}
            </Button>
          </div>
        </Block>

        <Block title="Controls">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Reject</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="grid max-w-xl gap-4">
            <Field label="Short title" hint="For example: Black phone">{(p) => <Input {...p} placeholder="Black phone" />}</Field>
            <Field label="With error" error="Enter at least 3 characters">{(p) => <Input {...p} defaultValue="a" />}</Field>
            <Field label="Description">{(p) => <Textarea {...p} />}</Field>
            <Field label="Select">{(p) => <Select {...p}><option>One</option><option>Two</option></Select>}</Field>
            <ZoneSelect value={zone} onChange={setZone} anyLabel="Any area" aria-label="Area" />
          </div>
          <CategoryChips label="Category" value={cat} onChange={setCat} />
          <div className="flex flex-wrap items-center gap-3">
            <Segmented label="Show" value={seg} onChange={setSeg} options={[{ value: "all", label: "All" }, { value: "lost", label: "Lost" }, { value: "found", label: "Found" }]} />
            <Chip selected>Selected</Chip>
            <Chip>Idle</Chip>
            <ItemStatusChip status="MATCHED" />
            <ClaimStatusChip status="FLAGGED" />
            <ClaimStatusChip status="REJECTED" />
            <Button variant="secondary" onClick={() => setSheet(true)}>Open sheet</Button>
          </div>
        </Block>

        <Block title="States">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[14px] bg-surface"><EmptyState title="No matches yet" body="We'll tell you when one appears." /></div>
            <div className="rounded-[14px] bg-surface"><ErrorState onRetry={() => {}} /></div>
          </div>
        </Block>
      </div>
      <BottomSheet open={sheet} onOpenChange={setSheet} title="Sheet" description="Radix dialog, restyled.">
        <p>Focus is trapped here. Escape closes it.</p>
      </BottomSheet>
    </PageShell>
  );
}
