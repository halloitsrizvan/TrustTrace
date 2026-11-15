"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

/** In mock mode the app waits for the MSW worker before it renders, so no request escapes. */
function MockGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!useMocks);
  useEffect(() => {
    if (!useMocks) return;
    let live = true;
    import("@/mocks/browser").then((m) => m.startMocks()).then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready ? <>{children}</> : null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (n, err) => ((err as { status?: number }).status ?? 500) >= 500 && n < 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        <MockGate>{children}</MockGate>
        <Toaster position="top-center" toastOptions={{ className: "!rounded-[12px] !font-sans" }} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
