import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/shell/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-12 pt-4">
      <Logo />
      <main id="main" className="mt-8">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
