import Link from "next/link";
import { cn, hashInt, ticketNo, timeAgo, zoneName } from "@/lib/utils";
import { copy } from "@/lib/copy";
import type { PublicItem } from "@/lib/api/types";
import { ItemPhoto, categoryIcons } from "./ItemPhoto";
import { ItemStatusChip, TypeChip } from "@/components/ui/chip";
import { Skel } from "@/components/ui/states";
import { Package } from "lucide-react";

const ratios = ["4 / 3", "1 / 1", "4 / 5"];

/** Lost tags hang from the top-left, Found tags from the top-right. */
function TagString({ side }: { side: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      width="44"
      height="34"
      viewBox="0 0 44 34"
      fill="none"
      className={cn("absolute top-0 text-ink-soft", side === "left" ? "left-1" : "right-1 -scale-x-100")}
    >
      <path d="M14 33 C 4 20, 6 3, 22 3 C 38 3, 38 20, 14 33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TagCard({
  item,
  score,
  tall,
  href,
  testid = "feed-item",
  decorative,
}: {
  item: PublicItem;
  score?: number;
  tall?: boolean;
  href?: string;
  testid?: string;
  /** Renders a non-interactive tag, for illustration. */
  decorative?: boolean;
}) {
  const lost = item.type === "LOST";
  const Icon = categoryIcons[item.category] ?? Package;
  const ratio = tall ? ratios[hashInt(item.id) % ratios.length] : "4 / 3";
  const place = `${zoneName(item.zone)}, ${timeAgo(item.occurredAt)}`;
  const body = (
    <>
      <TagString side={lost ? "left" : "right"} />
      <div className="printed-drop">
        <article
          className={cn(
            "relative overflow-hidden rounded-[6px] bg-surface",
            lost ? "tag-lost" : "tag-found",
          )}
        >
          {/* type band */}
          <span aria-hidden className={cn("absolute inset-y-0 w-2", lost ? "left-0 bg-lost" : "right-0 bg-found")} />
          {/* punched hole */}
          <span
            aria-hidden
            className={cn(
              "absolute top-2.5 size-3.5 rounded-full border border-rule bg-paper",
              lost ? "left-5" : "right-5",
            )}
          />
          <div className={cn("space-y-2 p-3 pt-8", lost ? "pl-5" : "pr-5")}>
            <ItemPhoto src={item.imageUrl} category={item.category} alt={`${item.title}, ${copy.type[item.type].toLowerCase()} item`} ratio={ratio} />
            <h3 className="font-display text-lg">{item.title}</h3>
            <p className="flex items-center gap-1.5 text-sm text-ink-soft">
              <Icon size={15} strokeWidth={1.75} aria-hidden />
              {place}
            </p>
            {typeof score === "number" ? (
              <p className="text-sm font-bold text-ink num">{score}% match</p>
            ) : null}
          </div>
          <div className={cn("perforation mx-3", lost ? "ml-5" : "mr-5")} />
          <div className={cn("flex flex-wrap items-center justify-between gap-2 p-3", lost ? "pl-5" : "pr-5")}>
            <span className="whitespace-nowrap font-display text-sm num">{ticketNo(item.id)}</span>
            <span className="flex items-center gap-1">
              <TypeChip type={item.type} />
              {item.status !== "OPEN" ? <ItemStatusChip status={item.status} /> : null}
            </span>
          </div>
        </article>
      </div>
    </>
  );
  return decorative ? (
    <div className="relative block pt-7" aria-hidden>
      {body}
    </div>
  ) : (
    <Link
      href={href ?? `/items/${item.id}`}
      data-testid={testid}
      aria-label={`${copy.type[item.type]}: ${item.title}. ${place}`}
      className="group relative block pt-7"
    >
      {body}
    </Link>
  );
}

export function SkeletonTag({ tall }: { tall?: boolean }) {
  return (
    <div aria-hidden className="relative break-inside-avoid pt-7">
      <div className="rounded-[6px] border border-rule bg-surface p-3 pt-6">
        <Skel className={cn("w-full", tall ? "h-40" : "h-28")} />
        <Skel className="mt-3 h-5 w-3/4" />
        <Skel className="mt-2 h-4 w-1/2" />
        <div className="perforation my-3" />
        <Skel className="h-5 w-full" />
      </div>
    </div>
  );
}
