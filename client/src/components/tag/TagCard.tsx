import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn, hashInt, ticketNo, timeAgo, zoneName } from "@/lib/utils";
import { copy } from "@/lib/copy";
import type { PublicItem } from "@/lib/api/types";
import { ItemPhoto } from "./ItemPhoto";
import { ItemStatusChip, TypeChip } from "@/components/ui/chip";
import { Skel } from "@/components/ui/states";

const ratios = ["4 / 3", "1 / 1", "4 / 5"];

/**
 * Item card. A horizontal row on phones (thumbnail, title, place, chevron) and a photo card from md up.
 * Lost and Found differ by the text chip and a coloured dot, never colour alone.
 */
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
  /** Renders a non-interactive card, for illustration. */
  decorative?: boolean;
}) {
  const lost = item.type === "LOST";
  const ratio = tall ? ratios[hashInt(item.id) % ratios.length] : "4 / 3";
  const place = zoneName(item.zone);
  const when = timeAgo(item.occurredAt);
  const body = (
    <article className={cn("printed rounded-3xl bg-surface p-3", decorative ? "block" : "flex items-center gap-3 md:block")}>
      <div className={cn("relative", decorative ? "w-full" : "w-20 shrink-0 md:w-full")}>
        <ItemPhoto
          src={item.imageUrl}
          category={item.category}
          alt={`${item.title}, ${copy.type[item.type].toLowerCase()} item`}
          ratio={ratio}
          className={decorative ? undefined : "aspect-square! md:aspect-auto!"}
        />
        {typeof score === "number" ? (
          <span className="num absolute bottom-1.5 right-1.5 rounded-lg bg-found px-2 py-0.5 text-xs font-bold text-[#06231a]">
            {score}%
          </span>
        ) : null}
      </div>
      <div className={cn("min-w-0 flex-1 space-y-1", decorative ? "mt-3" : "md:mt-3")}>
        <div className="flex items-center gap-1.5">
          {decorative ? null : <span aria-hidden className={cn("size-2 rounded-full", lost ? "bg-lost" : "bg-found")} />}
          <TypeChip type={item.type} />
          {item.status !== "OPEN" ? <ItemStatusChip status={item.status} /> : null}
        </div>
        <h3 className="font-display text-lg leading-tight">{item.title}</h3>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} strokeWidth={1.75} aria-hidden />
            {place}
          </span>
          <span>{when}</span>
        </p>
        {decorative ? null : <p className="num hidden text-xs text-ink-soft md:block">{ticketNo(item.id)}</p>}
      </div>
      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("shrink-0 text-ink-soft md:hidden", decorative && "hidden")}>
        <path d="m9 6 6 6-6 6" />
      </svg>
    </article>
  );
  return decorative ? (
    <div aria-hidden>{body}</div>
  ) : (
    <Link
      href={href ?? `/items/${item.id}`}
      data-testid={testid}
      aria-label={`${copy.type[item.type]}: ${item.title}. ${place}, ${when}`}
      className="block rounded-3xl"
    >
      {body}
    </Link>
  );
}

export function SkeletonTag({ tall }: { tall?: boolean }) {
  return (
    <div aria-hidden className="flex items-center gap-3 rounded-3xl bg-surface p-3 md:block">
      <Skel className="size-20 shrink-0 rounded-2xl md:h-32 md:w-full" />
      <div className="mt-0 flex-1 space-y-2 md:mt-3">
        <Skel className="h-4 w-1/3" />
        <Skel className="h-5 w-3/4" />
        <Skel className={tall ? "h-4 w-1/2" : "h-4 w-2/5"} />
      </div>
    </div>
  );
}
