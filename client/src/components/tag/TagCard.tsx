import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn, timeAgo, zoneName } from "@/lib/utils";
import { copy } from "@/lib/copy";
import type { PublicItem } from "@/lib/api/types";
import { ItemPhoto } from "./ItemPhoto";
import { Skel } from "@/components/ui/states";

/**
 * Item card: the photo leads, then title and place. Lost and Found are told apart by the label on the photo,
 * which carries a coloured dot and the word, never colour alone.
 */
export function TagCard({
  item,
  score,
  href,
  testid = "feed-item",
  decorative,
}: {
  item: PublicItem;
  score?: number;
  /** Kept for callers that used the masonry layout; the card is a fixed ratio now. */
  tall?: boolean;
  href?: string;
  testid?: string;
  /** Renders a non-interactive card, for illustration. */
  decorative?: boolean;
}) {
  const lost = item.type === "LOST";
  const place = zoneName(item.zone);
  const when = timeAgo(item.occurredAt);
  const body = (
    <article className="space-y-2.5">
      <div className="printed relative overflow-hidden rounded-3xl bg-surface">
        <ItemPhoto
          src={item.imageUrl}
          category={item.category}
          alt={`${item.title}, ${copy.type[item.type].toLowerCase()} item`}
          ratio="4 / 5"
          className="rounded-none!"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
          <span aria-hidden className={cn("size-2 rounded-full", lost ? "bg-lost" : "bg-found")} />
          {copy.type[item.type]}
        </span>
        {typeof score === "number" ? (
          <span className="num absolute bottom-3 right-3 rounded-lg bg-found px-2 py-0.5 text-xs font-bold text-[#06231a]">{score}%</span>
        ) : null}
      </div>
      <div className="space-y-0.5 px-1">
        <h3 className="line-clamp-2 font-display text-base leading-snug">{item.title}</h3>
        <p className="flex items-center gap-1 text-sm text-ink-soft">
          <MapPin size={14} strokeWidth={1.75} aria-hidden className="shrink-0" />
          <span className="truncate">{place}, {when}</span>
        </p>
      </div>
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

export function SkeletonTag() {
  return (
    <div aria-hidden className="space-y-2.5">
      <Skel className="aspect-[4/5] w-full rounded-3xl" />
      <Skel className="h-4 w-3/4" />
      <Skel className="h-4 w-1/2" />
    </div>
  );
}
