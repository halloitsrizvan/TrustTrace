import type { ReactNode } from "react";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/states";

export function DataTable<T>({
  cols,
  rows,
  loading,
  error,
  onRetry,
  rowKey,
  page,
  onPrev,
  onNext,
  hasNext,
  testid,
}: {
  cols: { head: string; cell: (r: T) => ReactNode; className?: string }[];
  rows?: T[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  rowKey: (r: T) => string;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  hasNext: boolean;
  testid?: string;
}) {
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorState title={copy.admin.errorTitle} body={copy.admin.errorBody} onRetry={onRetry} />;
  if (!rows?.length) return <EmptyState title={copy.admin.noRows} />;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-rule bg-surface">
        <table className="w-full min-w-[560px] text-left" data-testid={testid}>
          <thead>
            <tr className="border-b border-rule text-sm text-ink-soft">
              {cols.map((c) => <th key={c.head} scope="col" className="p-3 font-bold">{c.head}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} className="border-b border-rule last:border-0">
                {cols.map((c) => <td key={c.head} className={`p-3 ${c.className ?? ""}`}>{c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onPrev} disabled={page === 0}>{copy.admin.prev}</Button>
        <span className="num text-sm text-ink-soft">{page + 1}</span>
        <Button variant="secondary" size="sm" onClick={onNext} disabled={!hasNext}>{copy.admin.nextPage}</Button>
      </div>
    </div>
  );
}
