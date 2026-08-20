"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { hasMinimumRole } from "@/lib/auth/roles";
import { prefetchOrders } from "@/lib/queries/orders";
import { prefetchMenu } from "@/lib/queries/menu";
import { prefetchAdminOrders } from "@/lib/queries/adminOrders";
import { prefetchDashboard } from "@/lib/queries/dashboard";
import { prefetchUsers } from "@/lib/queries/users";
import type { Role } from "@prisma/client";

export function RolePrefetcher({ role }: { role: Role | null }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!role) return;

    // Cart is local-first (localStorage, see lib/cart/useLocalCart.ts) — no
    // TanStack Query cache to warm for it. Orders (below) still round-trip
    // the server, so eager-prefetching that on every authenticated load is
    // worth it.
    prefetchOrders(queryClient);

    if (hasMinimumRole(role, "STAFF")) {
      prefetchAdminOrders(queryClient);
      prefetchMenu(queryClient);
    }
    if (hasMinimumRole(role, "VENDOR_OWNER")) {
      prefetchDashboard(queryClient);
    }
    if (hasMinimumRole(role, "SITE_ADMIN")) {
      prefetchUsers(queryClient);
    }
  }, [role, queryClient]);

  return null;
}
