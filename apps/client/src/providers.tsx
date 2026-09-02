import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import type { ReactNode } from "react";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // An expired session should surface as an auth redirect, not as
            // three silent retries against a 401.
            retry: (failureCount, error) => {
              const code = (error as { data?: { code?: string } })?.data?.code;
              if (code === "UNAUTHORIZED" || code === "FORBIDDEN") return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // Same origin: Vite proxies /trpc in dev, the server serves the SPA
          // in production.
          url: "/trpc",
          transformer: superjson,
          fetch(url, options) {
            return fetch(url, { ...options, credentials: "include" });
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
