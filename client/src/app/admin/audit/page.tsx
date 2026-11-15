"use client";
import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import { useAdminAudit } from "@/lib/api/hooks";
import { timeAgo } from "@/lib/utils";
import { DataTable } from "@/components/admin/DataTable";
import { Input } from "@/components/ui/field";

const a = copy.admin;

export default function AdminAuditPage() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  useEffect(() => {
    const t = setTimeout(() => { setDq(q.trim()); setCursors([undefined]); }, 300);
    return () => clearTimeout(t);
  }, [q]);
  const page = cursors.length - 1;
  const r = useAdminAudit(cursors[page], dq);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">{a.auditTitle}</h1>
      <div className="max-w-sm">
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={a.searchAudit} aria-label={a.searchAudit} />
      </div>
      <DataTable
        testid="audit-table"
        loading={r.isLoading}
        error={r.isError}
        onRetry={() => r.refetch()}
        rows={r.data?.rows}
        rowKey={(x) => x.id}
        page={page}
        hasNext={!!r.data?.nextCursor}
        onNext={() => r.data?.nextCursor && setCursors((c) => [...c, r.data!.nextCursor!])}
        onPrev={() => setCursors((c) => c.slice(0, -1))}
        cols={[
          { head: a.col.when, cell: (x) => timeAgo(x.createdAt) },
          { head: a.col.action, cell: (x) => <span className="font-bold">{x.action}</span> },
          { head: a.col.actor, cell: (x) => x.actor },
          { head: a.col.target, cell: (x) => x.target },
        ]}
      />
    </div>
  );
}
