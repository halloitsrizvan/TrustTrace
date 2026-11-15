"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LayoutDashboard, ClipboardCheck, ScanLine, HandCoins, ScrollText, ArrowLeft } from "lucide-react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/admin", label: copy.nav.admin.dashboard, Icon: LayoutDashboard, exact: true },
  { href: "/admin/claims", label: copy.nav.admin.claims, Icon: ClipboardCheck },
  { href: "/admin/scan", label: copy.nav.admin.scan, Icon: ScanLine },
  { href: "/admin/tips", label: copy.nav.admin.tips, Icon: HandCoins },
  { href: "/admin/audit", label: copy.nav.admin.audit, Icon: ScrollText },
];

export function SidebarShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const on = (h: string, exact?: boolean) => (exact ? path === h : path === h || path.startsWith(`${h}/`));
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      <aside className="border-b border-rule bg-surface md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-3 md:flex-col md:items-stretch md:gap-4 md:p-4">
          <Logo href="/admin" />
          <nav aria-label={copy.nav.main} className="hidden md:block">
            <ul className="space-y-1">
              {links.map(({ href, label, Icon, exact }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={on(href, exact) ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-10 items-center gap-2.5 px-3 text-[15px] transition-colors duration-150 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-ultra before:transition-opacity",
                      on(href, exact)
                        ? "font-bold text-ink before:opacity-100"
                        : "text-ink-soft before:opacity-0 hover:text-ink",
                    )}
                  >
                    <Icon size={19} strokeWidth={1.75} aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden md:block md:mt-auto md:space-y-3">
            <ThemeToggle />
            <Link href="/board" className="flex min-h-10 items-center gap-2 px-3 text-[15px] text-ink-soft transition-colors duration-150 hover:text-ink">
              <ArrowLeft size={18} strokeWidth={1.75} aria-hidden /> {copy.nav.admin.backToApp}
            </Link>
          </div>
        </div>
        <nav aria-label={copy.nav.main} className="hide-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
          {links.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={on(href, exact) ? "page" : undefined}
              className={cn("inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm", on(href, exact) ? "border-ultra font-bold text-ink" : "border-transparent text-ink-soft")}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main id="main" className="min-w-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
