"use client";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { copy } from "@/lib/copy";
import { useItemsFeed, type ItemFilters } from "@/lib/api/hooks";
import { Segmented } from "@/components/ui/segmented";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
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
  const filtered = !!(filters.type || filters.category || filters.zone || filters.eventTag || filters.q);

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
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl md:text-4xl">{b.title}</h1>

      <div className="space-y-3">
        <div className="relative">
          <Search aria-hidden size={18} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={b.search}
            aria-label={b.searchLabel}
            data-testid="board-search"
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label={b.typeLabel}
            value={type}
            onChange={setType}
            testid="type-filter"
            options={[
              { value: "ALL", label: b.all },
              { value: "LOST", label: b.lost },
              { value: "FOUND", label: b.found },
            ]}
          />
          <div className="w-44">
            <ZoneSelect value={zone} onChange={setZone} anyLabel={b.zoneAny} aria-label={b.zoneLabel} />
          </div>
          <div className="w-44">
            <Select value={eventTag} onChange={(e) => setEventTag(e.target.value)} aria-label={b.eventLabel}>
              <option value="">{b.eventAny}</option>
              {b.events.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <CategoryChips label={b.categoryLabel} value={category} onChange={setCategory} allowNone />
      </div>

      {feed.isLoading ? (
        <div className="columns-2 gap-4 md:columns-3 xl:columns-4" role="status" aria-label={copy.states.loading}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <SkeletonTag tall={i % 3 === 0} />
            </div>
          ))}
        </div>
      ) : feed.isError ? (
        <ErrorState title={b.errorTitle} body={b.errorBody} onRetry={() => feed.refetch()} />
      ) : items.length === 0 ? (
        filtered ? (
          <EmptyState title={b.emptyTitle} body={b.emptyBody} action={<Button variant="secondary" onClick={clear}>{copy.action.clear}</Button>} />
        ) : (
          <EmptyState
            title={b.emptyBoardTitle}
            body={b.emptyBoardBody}
            action={<Button href="/report/lost">{copy.action.reportLost}</Button>}
          />
        )
      ) : (
        <>
          <div className="columns-2 gap-4 md:columns-3 xl:columns-4" data-testid="feed">
            {items.map((it) => (
              <div key={it.id} className="mb-4 break-inside-avoid">
                <TagCard item={it} tall />
              </div>
            ))}
          </div>
          <div ref={sentinel} className="h-8" aria-hidden />
          {isFetchingNextPage ? (
            <div className="columns-2 gap-4 md:columns-3 xl:columns-4">
              <SkeletonTag />
              <SkeletonTag />
            </div>
          ) : !hasNextPage ? (
            <p className="py-6 text-center text-ink-soft">{b.end}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
