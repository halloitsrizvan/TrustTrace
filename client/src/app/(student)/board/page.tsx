"use client";
import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useItemsFeed, type ItemFilters } from "@/lib/api/hooks";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/sheet";
import { CategoryChips, ZoneSelect } from "@/components/ui/pickers";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { SkeletonTag, TagCard } from "@/components/tag/TagCard";

type TypeFilter = "ALL" | "LOST" | "FOUND";

function useDebounced<T>(v: T, ms: number) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export default function BoardPage() {
  const [type, setType] = useState<TypeFilter>("ALL");
  const [category, setCategory] = useState("");
  const [zone, setZone] = useState("");
  const [eventTag, setEventTag] = useState("");
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(false);
  const dq = useDebounced(q.trim(), 300);

  const filters: ItemFilters = {
    type: type === "ALL" ? undefined : type,
    category: category || undefined,
    zone: zone || undefined,
    eventTag: eventTag || undefined,
    q: dq || undefined,
  };
  const feed = useItemsFeed(filters);
  const items = feed.data?.pages.flatMap((p) => p.items) ?? [];
  const events = [...new Set([...items.map((i) => i.eventTag), eventTag])].filter((e): e is string => !!e).sort();
  const extra = [category, zone, eventTag].filter(Boolean).length;
  const filtered = !!(filters.type || extra || filters.q);

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && !isFetchingNextPage && fetchNextPage(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function clear() {
    setType("ALL");
    setCategory("");
    setZone("");
    setEventTag("");
    setQ("");
  }

  const b = copy.board;
  const tabs: { value: TypeFilter; label: string }[] = [
    { value: "ALL", label: b.all },
    { value: "LOST", label: b.lost },
    { value: "FOUND", label: b.found },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search aria-hidden size={18} strokeWidth={1.75} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={b.search}
            aria-label={b.searchLabel}
            data-testid="board-search"
            className="printed min-h-12 rounded-full pl-11"
          />
        </div>
        <button
          type="button"
          onClick={() => setSheet(true)}
          aria-label={extra ? `${b.filters}, ${extra}` : b.filters}
          data-testid="filters-open"
          className="printed relative grid size-12 shrink-0 place-items-center rounded-full bg-surface text-ink"
        >
          <SlidersHorizontal size={20} strokeWidth={1.75} aria-hidden />
          {extra ? (
            <span aria-hidden className="num absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-ultra text-[11px] font-bold text-on-ultra">
              {extra}
            </span>
          ) : null}
        </button>
      </div>

      <div role="tablist" aria-label={b.typeLabel} data-testid="type-filter" className="flex gap-6 border-b border-rule">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={type === t.value}
            onClick={() => setType(t.value)}
            className={cn(
              "-mb-px min-h-11 border-b-2 text-base transition-colors duration-150",
              type === t.value ? "border-ultra font-bold text-ink" : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feed.isLoading ? (
        <div className="grid gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4" role="status" aria-label={copy.states.loading}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonTag key={i} tall={i % 3 === 0} />
          ))}
        </div>
      ) : feed.isError ? (
        <ErrorState title={b.errorTitle} body={b.errorBody} onRetry={() => feed.refetch()} />
      ) : items.length === 0 ? (
        filtered ? (
          <EmptyState title={b.emptyTitle} body={b.emptyBody} action={<Button variant="secondary" onClick={clear}>{copy.action.clear}</Button>} />
        ) : (
          <EmptyState title={b.emptyBoardTitle} body={b.emptyBoardBody} action={<Button href="/report/lost">{copy.action.reportLost}</Button>} />
        )
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3 md:items-start md:gap-4 xl:grid-cols-4" data-testid="feed">
            {items.map((it) => (
              <TagCard key={it.id} item={it} tall />
            ))}
          </div>
          <div ref={sentinel} className="h-8" aria-hidden />
          {isFetchingNextPage ? (
            <div className="grid gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
              <SkeletonTag />
              <SkeletonTag />
            </div>
          ) : null}
        </>
      )}

      <BottomSheet open={sheet} onOpenChange={setSheet} title={b.filters}>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-bold">{b.categoryLabel}</p>
            <CategoryChips label={b.categoryLabel} value={category} onChange={setCategory} allowNone />
          </div>
          <div className="space-y-2">
            <label htmlFor="f-zone" className="text-sm font-bold">{b.zoneLabel}</label>
            <ZoneSelect id="f-zone" value={zone} onChange={setZone} anyLabel={b.zoneAny} />
          </div>
          {events.length ? (
            <div className="space-y-2">
              <label htmlFor="f-event" className="text-sm font-bold">{b.eventLabel}</label>
              <Select id="f-event" value={eventTag} onChange={(e) => setEventTag(e.target.value)}>
                <option value="">{b.eventAny}</option>
                {events.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </Select>
            </div>
          ) : null}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => { setCategory(""); setZone(""); setEventTag(""); }} disabled={!extra}>
              {copy.action.clear}
            </Button>
            <Button className="flex-1" onClick={() => setSheet(false)}>{b.apply}</Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
