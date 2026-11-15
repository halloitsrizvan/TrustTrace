"use client";
import { copy } from "@/lib/copy";
import { useMyItems } from "@/lib/api/hooks";
import { MyTabs } from "@/components/MyTabs";
import { SkeletonTag, TagCard } from "@/components/tag/TagCard";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/states";

export default function MyItemsPage() {
  const q = useMyItems();
  const m = copy.my;
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">{m.reportsTitle}</h1>
      <MyTabs />
      {q.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          <SkeletonTag /><SkeletonTag /><SkeletonTag />
        </div>
      ) : q.isError ? (
        <ErrorState title={m.errorTitle} body={m.errorBody} onRetry={() => q.refetch()} />
      ) : q.data!.length === 0 ? (
        <EmptyState title={m.reportsEmptyTitle} body={m.reportsEmptyBody} action={<Button href="/report/lost">{copy.action.reportLost}</Button>} />
      ) : (
        <div className="grid grid-cols-2 items-start gap-4 md:grid-cols-3 xl:grid-cols-4" data-testid="my-items">
          {q.data!.map((i) => <TagCard key={i.id} item={i} testid="my-item" />)}
        </div>
      )}
    </div>
  );
}
