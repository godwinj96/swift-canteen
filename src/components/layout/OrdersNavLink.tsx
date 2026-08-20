"use client";

import { prefetchOrders } from "@/lib/queries/orders";
import { PrefetchLink } from "./PrefetchLink";

// A tiny client wrapper so Navbar (a Server Component) never has to pass the
// prefetchOrders function reference across the server/client boundary as a
// prop — functions aren't serializable there and Next.js throws at render time.
export function OrdersNavLink() {
  return (
    <PrefetchLink href="/orders" prefetchData={prefetchOrders} className="text-muted hover:text-canteen">
      My Orders
    </PrefetchLink>
  );
}
