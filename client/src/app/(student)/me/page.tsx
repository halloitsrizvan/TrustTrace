"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import { useMe, useProfile, useTipsGiven, useTipsReceived, useWallet } from "@/lib/api/hooks";
import { rupees, timeAgo } from "@/lib/utils";
import type { Tip } from "@/lib/api/types";
import { Avatar } from "@/components/Avatar";
import { Badges } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { ErrorState, Skel } from "@/components/ui/states";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

const p = copy.profile;

function TipList({ title, tips, mode }: { title: string; tips?: Tip[]; mode: "given" | "received" }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-xl">{title}</h3>
      {!tips ? (
        <Skel className="h-16 w-full" />
      ) : tips.length === 0 ? (
        <p className="text-ink-soft">{p.tipsEmpty}</p>
      ) : (
        <ul className="divide-y divide-rule rounded-[14px] border border-rule bg-surface">
          {tips.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 p-3">
              <span>
                <span className="block font-bold">
                  {mode === "received" ? (t.anonymous || !t.fromName ? p.anonymousTipper : t.fromName) : (t.toName ?? "")}
                </span>
                {t.note ? <span className="block text-sm text-ink-soft">{t.note}</span> : null}
                <span className="block text-sm text-ink-soft">{timeAgo(t.createdAt)}</span>
              </span>
              <span className="font-display text-lg num">{rupees(t.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
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

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="flex items-center gap-4">
        <Avatar name={u.name} size={64} />
        <div>
          <h1 className="font-display text-3xl">{u.name}</h1>
          <p className="text-ink-soft">{u.email}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-[14px] border border-rule bg-surface p-4">
          <dd className="font-display text-4xl num">{pr?.karma ?? "-"}</dd>
          <dt className="text-ink-soft">{p.karma}</dt>
        </div>
        <div className="rounded-[14px] border border-rule bg-surface p-4">
          <dd className="font-display text-4xl num">{pr?.returns ?? "-"}</dd>
          <dt className="text-ink-soft">{p.returns}</dt>
        </div>
      </dl>
      <Badges badges={pr?.badges ?? []} />

      <section className="space-y-3" aria-labelledby="wallet-h">
        <h2 id="wallet-h" className="font-display text-2xl">{p.wallet}</h2>
        <div className="rounded-[14px] bg-surface p-5 printed">
          <p className="text-ink-soft">{p.balance}</p>
          <p className="font-display text-4xl num" data-testid="wallet-balance">{wallet.data ? rupees(wallet.data.balance) : "-"}</p>
        </div>
        <h3 className="font-display text-xl">{p.ledger}</h3>
        {wallet.data && wallet.data.ledger.length === 0 ? (
          <p className="text-ink-soft">{p.ledgerEmpty}</p>
        ) : (
          <ul className="divide-y divide-rule rounded-[14px] border border-rule bg-surface">
            {(wallet.data?.ledger ?? []).map((l) => (
              <li key={l.id} className="flex justify-between gap-3 p-3">
                <span>{l.label}<span className="block text-sm text-ink-soft">{timeAgo(l.createdAt)}</span></span>
                <span className="font-display text-lg num">+{rupees(l.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <TipList title={p.tipsReceived} tips={received.data} mode="received" />
      <TipList title={p.tipsGiven} tips={given.data} mode="given" />

      <section className="space-y-3">
        <h2 className="font-display text-2xl">{p.theme}</h2>
        <ThemeToggle />
      </section>
      <div className="flex flex-wrap gap-3 border-t border-rule pt-6">
        <Button href="/items/mine" variant="secondary">{copy.nav.myReports}</Button>
        <Button href="/claims" variant="secondary">{copy.nav.claims}</Button>
        {u.role === "ADMIN" ? <Button href="/admin" variant="secondary">{copy.nav.admin.dashboard}</Button> : null}
        <Link href={`/u/${u.id}`} className="inline-flex min-h-11 items-center px-2 font-bold text-ultra underline underline-offset-4">{p.publicProfile}</Link>
        <Button variant="ghost" onClick={signOut} className="ml-auto" data-testid="sign-out">{copy.action.signOut}</Button>
      </div>
    </div>
  );
}
