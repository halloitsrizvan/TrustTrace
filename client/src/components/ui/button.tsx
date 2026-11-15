import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "lost" | "found";
type Size = "md" | "lg" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[12px] font-bold select-none transition-[transform,background-color,opacity] duration-150 active:translate-y-px active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-ultra text-on-ultra hover:opacity-90",
  secondary: "bg-surface text-ink border border-rule hover:bg-ultra-tint",
  ghost: "text-ink hover:bg-ultra-tint",
  danger: "bg-rejected text-white hover:opacity-90 dark:text-[#0d1130]",
  lost: "bg-lost text-[#141a3c] hover:opacity-90",
  found: "bg-found text-[#141a3c] hover:opacity-90",
};
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-base",
  lg: "min-h-12 px-6 text-lg",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", href, className, children, ...rest }: Props) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <Link href={href} className={cls} data-testid={rest["data-testid" as keyof typeof rest] as string | undefined}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
