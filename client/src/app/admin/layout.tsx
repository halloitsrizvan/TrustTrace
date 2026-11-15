"use client";
import type { ReactNode } from "react";
import { copy } from "@/lib/copy";
import { useMe } from "@/lib/api/hooks";
import { SidebarShell } from "@/components/shell/SidebarShell";
import { Button } from "@/components/ui/button";
import { EmptyState, Skel } from "@/components/ui/states";

// Role comes from GET /auth/me. The backend enforces it too; this keeps students out of the screens.
export default function AdminLayout({ children }: { children: ReactNode }) {
  const me = useMe();
  if (me.isLoading) return <div className="p-8"><Skel className="h-40 w-full" /></div>;
  if (me.data?.role !== "ADMIN")
    return (
      <div className="mx-auto max-w-md pt-20">
        <EmptyState title={copy.admin.notAdminTitle} body={copy.admin.notAdminBody} action={<Button href="/board">{copy.action.seeBoard}</Button>} />
      </div>
    );
  return <SidebarShell>{children}</SidebarShell>;
}
