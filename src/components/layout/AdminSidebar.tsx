"use client";

import { usePathname } from "next/navigation";
import { PrefetchLink } from "./PrefetchLink";
import { hasMinimumRole } from "@/lib/auth/roles";
import { prefetchDashboard } from "@/lib/queries/dashboard";
import { prefetchMenu } from "@/lib/queries/menu";
import { prefetchAdminOrders } from "@/lib/queries/adminOrders";
import { prefetchUsers } from "@/lib/queries/users";
import type { QueryClient } from "@tanstack/react-query";
import type { Role } from "@prisma/client";

const LINKS: { href: string; label: string; minimumRole: Role; prefetchData?: (qc: QueryClient) => unknown }[] = [
  { href: "/admin", label: "Dashboard", minimumRole: "STAFF", prefetchData: prefetchDashboard },
  { href: "/admin/menu", label: "Menu", minimumRole: "STAFF", prefetchData: prefetchMenu },
  { href: "/admin/orders", label: "Orders", minimumRole: "STAFF", prefetchData: prefetchAdminOrders },
  { href: "/admin/reports", label: "Reports", minimumRole: "VENDOR_OWNER", prefetchData: prefetchDashboard },
  { href: "/admin/users", label: "Users", minimumRole: "SITE_ADMIN", prefetchData: prefetchUsers },
];

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = LINKS.filter((link) => hasMinimumRole(role, link.minimumRole));

  return (
    <aside className="shrink-0 rounded-2xl bg-canteen-light p-4 md:w-52">
      <p className="mb-3 px-3 text-[11px] font-semibold tracking-[0.08em] text-canteen-dark uppercase">
        Canteen admin
      </p>
      <nav className="flex gap-1 overflow-x-auto text-sm font-medium md:flex-col md:overflow-visible">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <PrefetchLink
              key={link.href}
              href={link.href}
              prefetchData={link.prefetchData}
              className={`shrink-0 rounded-full px-4 py-2.5 whitespace-nowrap transition-colors ${
                isActive ? "bg-ink text-white" : "text-ink hover:bg-white"
              }`}
            >
              {link.label}
            </PrefetchLink>
          );
        })}
      </nav>
    </aside>
  );
}
