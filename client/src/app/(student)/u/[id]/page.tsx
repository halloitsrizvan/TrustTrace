"use client";
import { use } from "react";
import { copy } from "@/lib/copy";
import { ApiError } from "@/lib/api/client";
import { useProfile } from "@/lib/api/hooks";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skel } from "@/components/ui/states";
import { Badges } from "@/components/Badges";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const q = useProfile(id);
  const p = copy.profile;
  if (q.isLoading) return <Skel className="mx-auto h-48 max-w-xl" />;
  if (q.isError)
    return (q.error as ApiError).status === 404 ? (
      <EmptyState title={p.notFoundTitle} body={p.notFoundBody} action={<Button href="/heroes">{copy.nav.heroes}</Button>} />
    ) : (
      <ErrorState title={p.errorTitle} body={p.errorBody} onRetry={() => q.refetch()} />
    );
  const u = q.data!;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={u.name} size={64} />
        <h1 className="font-display text-3xl">{u.name}</h1>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-[14px] border border-rule bg-surface p-4">
          <dd className="font-display text-4xl num">{u.karma}</dd>
          <dt className="text-ink-soft">{p.karma}</dt>
        </div>
        <div className="rounded-[14px] border border-rule bg-surface p-4">
          <dd className="font-display text-4xl num">{u.returns}</dd>
          <dt className="text-ink-soft">{p.returns}</dt>
        </div>
      </dl>
      <Badges badges={u.badges} />
    </div>
  );
}
