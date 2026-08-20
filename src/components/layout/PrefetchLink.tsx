"use client";

import Link, { type LinkProps } from "next/link";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";

interface PrefetchLinkProps extends LinkProps {
  className?: string;
  children: React.ReactNode;
  // Warms whatever TanStack Query cache the destination page reads from,
  // on hover/focus intent — so the click lands on already-resolved data
  // instead of a cold fetch. Pages with no client-side query (a Server
  // Component reading straight from the cache layer, e.g. /menu) don't need
  // one; Next.js's own <Link> already prefetches their route/RSC payload.
  prefetchData?: (queryClient: QueryClient) => unknown;
}

export function PrefetchLink({ children, prefetchData, ...props }: PrefetchLinkProps) {
  const queryClient = useQueryClient();

  function handlePrefetch() {
    prefetchData?.(queryClient);
  }

  return (
    <Link {...props} onMouseEnter={handlePrefetch} onFocus={handlePrefetch}>
      {children}
    </Link>
  );
}
