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
      <section className="space-y-4 pt-1">
        <h1 className="font-display text-3xl leading-[1.1] md:text-5xl">{b.heroTitle}</h1>
        <div className="relative">
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2273eb] to-[#4aa0ff] p-5 text-white md:max-w-xl">
          <div aria-hidden className="absolute -right-6 -top-6 size-36 rounded-full bg-white/15" />
          <div aria-hidden className="absolute -bottom-10 right-10 size-28 rounded-full bg-white/10" />
          <h2 className="font-display text-xl">{b.bannerTitle}</h2>
          <p className="mt-1 max-w-[16rem] text-sm text-white/90">{b.bannerBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button href="/report/lost" variant="secondary" size="sm" className="border-transparent bg-white text-[#14306b]">{copy.action.reportLost}</Button>
            <Button href="/report/found" variant="secondary" size="sm" className="border-transparent bg-white/20 text-white hover:bg-white/30">{copy.action.reportFound}</Button>
          </div>
        </div>
      </section>

      <div className="space-y-3">
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

      <h2 className="font-display text-2xl">{b.recent}</h2>

      {feed.isLoading ? (
        <div className="grid gap-3 md:grid-cols-3 md:gap-4 md:items-start xl:grid-cols-4" role="status" aria-label={copy.states.loading}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
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
          <div className="grid gap-3 md:grid-cols-3 md:gap-4 md:items-start xl:grid-cols-4" data-testid="feed">
            {items.map((it) => (
              <div key={it.id}>
                <TagCard item={it} tall />
              </div>
            ))}
          </div>
          <div ref={sentinel} className="h-8" aria-hidden />
          {isFetchingNextPage ? (
            <div className="grid gap-3 md:grid-cols-3 md:gap-4 md:items-start xl:grid-cols-4">
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
