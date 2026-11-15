"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

export function MyTabs() {
  const path = usePathname();
  const tabs = [
    { href: "/items/mine", label: copy.my.tabReports },
    { href: "/claims", label: copy.my.tabClaims },
  ];
  return (
    <nav aria-label={copy.nav.myReports} className="inline-flex rounded-[12px] border border-rule bg-surface p-1">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={path === t.href ? "page" : undefined}
          className={cn("inline-flex min-h-10 min-w-24 items-center justify-center rounded-[9px] px-4 text-sm", path === t.href ? "bg-ultra font-bold text-on-ultra" : "hover:bg-ultra-tint")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
