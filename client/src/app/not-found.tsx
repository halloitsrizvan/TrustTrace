import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shell/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-4">
      <Logo />
      <main id="main" className="flex flex-1 flex-col items-start justify-center gap-4 pb-24">
        <p className="font-display text-7xl num text-ultra">404</p>
        <h1 className="font-display text-3xl">{copy.notFound.title}</h1>
        <p className="text-ink-soft">{copy.notFound.body}</p>
        <Button href="/board" size="lg">{copy.notFound.home}</Button>
      </main>
    </div>
  );
}
