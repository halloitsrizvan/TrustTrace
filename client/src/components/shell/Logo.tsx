import Link from "next/link";
import { copy } from "@/lib/copy";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2 rounded-[8px]">
      <svg aria-hidden width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M7 2h15a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H7L2 19V4a2 2 0 0 1 2-2h3z" fill="var(--ultra)" />
        <circle cx="8.5" cy="8.5" r="2.2" fill="var(--paper)" />
      </svg>
      <span className="font-display text-xl">{copy.app.name}</span>
    </Link>
  );
}
