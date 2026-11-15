import type { ReactNode } from "react";
import { PageShell } from "@/components/shell/PageShell";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <PageShell wide>{children}</PageShell>;
}
