"use client";

import { formatNaira } from "@/lib/currency";
import { useDashboardStats, type DashboardStats } from "@/lib/queries/dashboard";

export function AdminDashboardClient({ initialStats }: { initialStats: DashboardStats }) {
  const { data: stats = initialStats } = useDashboardStats(initialStats);

  const cards = [
    { label: "Orders today", value: stats.todayOrders },
    { label: "Active orders", value: stats.pendingOrders },
    { label: "Revenue today", value: formatNaira(stats.todayRevenue) },
    { label: "Available items", value: stats.totalMenuItems },
  ];

  return (
    <div>
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Overview
      </span>
      <h1 className="font-display mt-2 mb-8 text-4xl tracking-tight text-ink">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-canteen-light p-6">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="font-display mt-1 text-3xl tracking-tight text-ink">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
