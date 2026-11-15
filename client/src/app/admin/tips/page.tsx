"use client";
import { useState } from "react";
import { copy } from "@/lib/copy";
import { useAdminTips } from "@/lib/api/hooks";
import { rupees, timeAgo } from "@/lib/utils";
import { DataTable } from "@/components/admin/DataTable";
import { Segmented } from "@/components/ui/segmented";
import { Pill } from "@/components/ui/chip";

const a = copy.admin;

export default function AdminTipsPage() {
  const [status, setStatus] = useState("");
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const page = cursors.length - 1;
  const q = useAdminTips(cursors[page], status);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">{a.tipsTitle}</h1>
      <Segmented
        label={a.col.status}
        value={status}
        onChange={(v) => { setStatus(v); setCursors([undefined]); }}
        options={[{ value: "", label: a.filterAll }, { value: "CONFIRMED", label: a.confirmed }, { value: "PENDING", label: a.pending }]}
      />
      <DataTable
        testid="tips-table"
        loading={q.isLoading}
        error={q.isError}
        onRetry={() => q.refetch()}
        rows={q.data?.rows}
        rowKey={(r) => r.id}
        page={page}
        hasNext={!!q.data?.nextCursor}
        onNext={() => q.data?.nextCursor && setCursors((c) => [...c, q.data!.nextCursor!])}
        onPrev={() => setCursors((c) => c.slice(0, -1))}
        cols={[
          { head: a.col.when, cell: (r) => timeAgo(r.createdAt) },
          { head: a.col.from, cell: (r) => r.fromName ?? copy.profile.anonymousTipper },
          { head: a.col.to, cell: (r) => r.toName ?? "" },
          { head: a.col.amount, cell: (r) => <span className="font-display num">{rupees(r.amount)}</span> },
          { head: a.col.status, cell: (r) => <Pill tone={r.status === "CONFIRMED" ? "found" : "review"}>{r.status === "CONFIRMED" ? a.confirmed : a.pending}</Pill> },
        ]}
      />
    </div>
  );
}
