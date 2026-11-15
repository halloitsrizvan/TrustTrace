"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Bell, LayoutGrid, Plus, Sparkles, UserRound, Trophy, PackageSearch, PackagePlus } from "lucide-react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useMe, useNotifications } from "@/lib/api/hooks";
import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

function ReportSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={copy.report.chooseTitle} testid="report-sheet">
      <div className="grid gap-3">
        <Link
          href="/report/lost"
          onClick={() => onOpenChange(false)}
          data-testid="report-lost-link"
          className="flex min-h-16 items-center gap-3 rounded-[12px] border border-rule bg-lost-tint p-4 text-lost-ink"
        >
          <PackageSearch aria-hidden size={26} strokeWidth={1.75} />
          <span className="font-display text-lg">{copy.report.chooseLost}</span>
        </Link>
        <Link
          href="/report/found"
          onClick={() => onOpenChange(false)}
          data-testid="report-found-link"
          className="flex min-h-16 items-center gap-3 rounded-[12px] border border-rule bg-found-tint p-4 text-found-ink"
        >
          <PackagePlus aria-hidden size={26} strokeWidth={1.75} />
          <span className="font-display text-lg">{copy.report.chooseFound}</span>
        </Link>
      </div>
    </BottomSheet>
  );
}

export function PageShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const path = usePathname();
  const [sheet, setSheet] = useState(false);
  const me = useMe();
  const notifs = useNotifications();
  const unread = (notifs.data ?? []).filter((n) => !n.readAt).length;
  const signedIn = !!me.data;

  const links = [
    { href: "/board", label: copy.nav.board, Icon: LayoutGrid },
    { href: "/matches", label: copy.nav.matches, Icon: Sparkles },
    { href: "/heroes", label: copy.nav.heroes, Icon: Trophy },
  ];
  const active = (h: string) => path === h || path.startsWith(`${h}/`);

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 md:px-6">
          <Logo href="/board" />
          <nav aria-label={copy.nav.main} className="ml-4 hidden items-center gap-1 md:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-[12px] px-3 text-base",
                  active(href) ? "bg-ultra-tint font-bold" : "hover:bg-ultra-tint",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {signedIn ? (
              <>
                <Button variant="primary" size="md" className="max-md:hidden" onClick={() => setSheet(true)} data-testid="report-open">
                  <Plus size={18} strokeWidth={1.75} aria-hidden /> {copy.nav.report}
                </Button>
                <Link
                  href="/notifications"
                  aria-label={unread ? `${copy.nav.notifications}, ${unread} unread` : copy.nav.notifications}
                  className="relative grid size-11 place-items-center rounded-full hover:bg-ultra-tint"
                >
                  <Bell size={21} strokeWidth={1.75} aria-hidden />
                  {unread > 0 ? <span aria-hidden className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-lost ring-2 ring-paper" /> : null}
                </Link>
                <Link href="/me" aria-label={copy.nav.me} className="grid size-11 place-items-center rounded-full hover:bg-ultra-tint max-md:hidden">
                  <UserRound size={21} strokeWidth={1.75} aria-hidden />
                </Link>
              </>
            ) : !me.isLoading ? (
              <Button href="/login" variant="primary">
                {copy.action.signIn}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main id="main" className={cn("mx-auto px-4 py-5 md:px-6 md:py-8", wide ? "max-w-7xl" : "max-w-3xl")}>
        {children}
      </main>

      {/* mobile tab bar */}
      <nav
        aria-label={copy.nav.main}
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4 items-end px-2">
          <TabLink href="/board" label={copy.nav.board} Icon={LayoutGrid} on={active("/board")} />
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => (signedIn ? setSheet(true) : (window.location.href = "/login?next=/board"))}
              data-testid="report-tab"
              aria-label={copy.nav.report}
              className="-mt-5 grid size-14 place-items-center rounded-full bg-ultra text-on-ultra shadow-[3px_3px_0_rgba(20,26,60,0.2)] transition-transform active:scale-95"
            >
              <Plus size={26} strokeWidth={1.75} aria-hidden />
            </button>
          </li>
          <TabLink href="/matches" label={copy.nav.matches} Icon={Sparkles} on={active("/matches")} />
          <TabLink href="/me" label={copy.nav.me} Icon={UserRound} on={active("/me")} />
        </ul>
      </nav>
      <ReportSheet open={sheet} onOpenChange={setSheet} />
    </div>
  );
}

function TabLink({ href, label, Icon, on }: { href: string; label: string; Icon: typeof Bell; on: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={on ? "page" : undefined}
        className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs", on ? "font-bold text-ultra" : "text-ink-soft")}
      >
        <Icon size={22} strokeWidth={1.75} aria-hidden />
        {label}
      </Link>
    </li>
  );
}
