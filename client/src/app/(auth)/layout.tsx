import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/shell/Logo";
import { AuthArt } from "@/components/AuthArt";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(360px,1fr)_3fr]">
      <div className="flex min-h-dvh flex-col bg-surface px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] lg:px-8">
        <Logo />
        <main id="main" className="flex flex-1 items-center py-10">
          <div className="w-full">
            <Suspense>{children}</Suspense>
          </div>
        </main>
      </div>
      <div className="hidden p-3 lg:sticky lg:top-0 lg:block lg:h-dvh">
        <div className="grid h-full min-h-0 place-items-center overflow-hidden rounded-[32px] bg-gradient-to-br from-[#6fb0ff] via-[#8fc3ff] to-[#c4dfff] p-8 dark:from-[#1c3f8f] dark:via-[#17316f] dark:to-[#102452]">
          <AuthArt />
        </div>
      </div>
    </div>
  );
}
