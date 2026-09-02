import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Client-side replacement for the Next.js middleware auth gate: unauthenticated
 * visitors are bounced to the sign-in page with a callback back to where they
 * were headed.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { data, isLoading, isError } = trpc.me.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isError) {
      navigate(`/auth/sign-in?callbackUrl=${encodeURIComponent(location)}`, { replace: true });
    }
  }, [isError, location, navigate]);

  if (isLoading || isError || !data) {
    return null;
  }

  return <>{children}</>;
}
