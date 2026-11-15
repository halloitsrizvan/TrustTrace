"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { copy } from "@/lib/copy";
import { cn, rupees, timeAgo } from "@/lib/utils";
import { useMe, useProfile, useTipsGiven, useTipsReceived, useWallet } from "@/lib/api/hooks";
import type { Tip } from "@/lib/api/types";
import { Avatar } from "@/components/Avatar";
import { BadgeSeal } from "@/components/tag/Stamp";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { ErrorState, Skel } from "@/components/ui/states";

const p = copy.profile;

function Stat({ label, value, testid }: { label: string; value: string | number; testid?: string }) {
  return (
    <div className="flex-1 px-4 py-3 text-center">
      <p className="font-display text-2xl num" data-testid={testid}>{value}</p>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-14 items-center justify-between gap-3 px-4 transition-colors hover:text-ultra">
      <span>{children}</span>
      <ChevronRight size={18} strokeWidth={1.75} aria-hidden className="text-ink-soft" />
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl">{title}</h2>
      {children}
    </section>
  );
}

function TipRows({ tips, mode }: { tips?: Tip[]; mode: "given" | "received" }) {
  if (!tips) return <Skel className="h-14 w-full" />;
  if (tips.length === 0) return <p className="text-ink-soft">{p.tipsEmpty}</p>;
  return (
    <ul className="divide-y divide-rule rounded-3xl bg-surface">
      {tips.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="min-w-0">
            <span className="block truncate font-bold">
              {mode === "received" ? (t.anonymous || !t.fromName ? p.anonymousTipper : t.fromName) : (t.toName ?? "")}
            </span>
            <span className="block truncate text-sm text-ink-soft">{t.note ? `${t.note}, ` : ""}{timeAgo(t.createdAt)}</span>
          </span>
          <span className="font-display text-lg num">{rupees(t.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MePage() {
  const me = useMe();
  const router = useRouter();
  const qc = useQueryClient();
  const profile = useProfile(me.data?.id ?? "");
  const wallet = useWallet();
  const given = useTipsGiven();
  const received = useTipsReceived();
  const [tipTab, setTipTab] = useState<"received" | "given">("received");

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    qc.clear();
    toast(copy.auth.signedOut);
    router.replace("/login");
  }

  if (me.isError) return <ErrorState title={p.errorTitle} body={p.errorBody} onRetry={() => me.refetch()} />;
  if (!me.data) return <Skel className="mx-auto h-40 max-w-xl" />;
  const u = me.data;
  const pr = profile.data;
  const ledger = wallet.data?.ledger ?? [];

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="flex items-center gap-4">
        <Avatar name={u.name} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl">{u.name}</h1>
          <p className="truncate text-ink-soft">{u.email}</p>
        </div>
        <button type="button" onClick={signOut} data-testid="sign-out" className="min-h-11 px-2 font-bold text-ink-soft transition-colors hover:text-ink">
          {copy.action.signOut}
        </button>
      </div>

      <div className="flex divide-x divide-rule rounded-3xl bg-surface">
        <Stat label={p.karma} value={pr?.karma ?? "-"} />
        <Stat label={p.returns} value={pr?.returns ?? "-"} />
        <Stat label={p.balance} value={wallet.data ? rupees(wallet.data.balance) : "-"} testid="wallet-balance" />
      </div>

      <nav aria-label={u.name} className="divide-y divide-rule rounded-3xl bg-surface">
        <Row href="/activity">{copy.nav.activity}</Row>
        <Row href={`/u/${u.id}`}>{p.publicProfile}</Row>
        {u.role === "ADMIN" ? <Row href="/admin">{copy.nav.admin.dashboard}</Row> : null}
        <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
          <span>{p.theme}</span>
          <ThemeToggle />
        </div>
      </nav>

      {pr && pr.badges.length > 0 ? (
        <Section title={p.badges}>
          <ul className="flex flex-wrap gap-5">
            {pr.badges.map((b) => (
              <li key={b}>
                <BadgeSeal code={b} size={52} showName />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title={p.tips}>
        <div role="tablist" aria-label={p.tips} className="flex gap-6 border-b border-rule">
          {(["received", "given"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tipTab === t}
              onClick={() => setTipTab(t)}
              className={cn(
                "-mb-px min-h-11 border-b-2 transition-colors",
                tipTab === t ? "border-ultra font-bold text-ink" : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {t === "received" ? p.tipsReceived : p.tipsGiven}
            </button>
          ))}
        </div>
        <TipRows tips={tipTab === "received" ? received.data : given.data} mode={tipTab} />
      </Section>

      {ledger.length > 0 ? (
        <Section title={p.ledger}>
          <ul className="divide-y divide-rule rounded-3xl bg-surface">
            {ledger.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  {l.label}
                  <span className="block text-sm text-ink-soft">{timeAgo(l.createdAt)}</span>
                </span>
                <span className="font-display text-lg num">{l.kind === "DEBIT" ? "-" : "+"}{rupees(l.amount)}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
