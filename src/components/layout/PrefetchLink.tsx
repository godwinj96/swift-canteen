"use client";

import Link, { type LinkProps } from "next/link";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { cartQueryKey, prefetchCart } from "@/lib/queries/cart";

interface PrefetchLinkProps extends LinkProps {
  className?: string;
  children: React.ReactNode;
  prefetchData?: (queryClient: QueryClient) => unknown;
}

export function PrefetchLink({ children, prefetchData, ...props }: PrefetchLinkProps) {
  const queryClient = useQueryClient();

  function handlePrefetch() {
    if (prefetchData) {
      prefetchData(queryClient);
      return;
    }
    if (!queryClient.getQueryData(cartQueryKey)) {
      prefetchCart(queryClient);
    }
  }

  return (
    <Link {...props} onMouseEnter={handlePrefetch} onFocus={handlePrefetch}>
      {children}
    </Link>
  );
}
