"use client";

import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/currency";
import { useDashboardReports, type DashboardReports } from "@/lib/queries/dashboard";

export function AdminReportsClient({ initialReports }: { initialReports: DashboardReports }) {
  const { data: reports = initialReports } = useDashboardReports(initialReports);
  const sortedDays = [...reports.revenueByDay].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 14);

  return (
    <div>
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Insights
      </span>
      <h1 className="font-display mt-2 mb-8 text-4xl tracking-tight text-ink">Reports</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Total revenue</p>
          <p className="font-display mt-1 text-3xl tracking-tight text-ink">{formatNaira(reports.totalRevenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Total orders</p>
          <p className="font-display mt-1 text-3xl tracking-tight text-ink">{reports.totalOrders}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Revenue by day (last 14)</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {sortedDays.map(({ date, revenue }) => (
              <li key={date} className="flex justify-between">
                <span className="text-muted">{date}</span>
                <span className="font-medium">{formatNaira(revenue)}</span>
              </li>
            ))}
            {sortedDays.length === 0 && <li className="text-muted">No orders yet.</li>}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-ink">Top items</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {reports.topItems.map((t) => (
              <li key={t.itemId} className="flex justify-between">
                <span className="text-muted">{t.name}</span>
                <span className="font-medium">{t.quantitySold} sold</span>
              </li>
            ))}
            {reports.topItems.length === 0 && <li className="text-muted">No orders yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
