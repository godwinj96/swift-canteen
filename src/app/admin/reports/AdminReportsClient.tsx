"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { TrendChart } from "@/components/charts/TrendChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { BarChart } from "@/components/charts/BarChart";
import { formatNaira } from "@/lib/currency";
import { useDashboardReports, type DashboardReports } from "@/lib/queries/dashboard";
import { ANALYTICS_RANGES, DEFAULT_ANALYTICS_RANGE, boundsForRange, type AnalyticsRangeId } from "@/lib/dateRanges";

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => `${h}:00`);

export function AdminReportsClient({ initialReports }: { initialReports: DashboardReports }) {
  const [rangeId, setRangeId] = useState<AnalyticsRangeId>(DEFAULT_ANALYTICS_RANGE);
  const bounds = boundsForRange(rangeId);
  const { data: reports = initialReports } = useDashboardReports(bounds, initialReports);

  const revenueSeries = reports.revenueByDay
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((d) => ({ label: d.date.slice(5), value: d.revenue }));

  const avgOrderValue = reports.totalOrders > 0 ? reports.totalRevenue / reports.totalOrders : 0;

  const topItemsData = reports.topItems.map((item) => ({ label: item.name, value: item.quantitySold }));
  const hourlyData = reports.ordersByHour
    .filter((h) => h.count > 0)
    .map((h) => ({ label: HOUR_LABELS[h.hour], value: h.count }))
    .sort((a, b) => b.value - a.value);

  const rangeTabs: TabItem[] = ANALYTICS_RANGES.map((r) => ({ id: r.id, label: r.label }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">Insights</span>
          <h1 className="font-display mt-2 text-4xl tracking-tight text-ink">Analytics</h1>
        </div>
        <Tabs tabs={rangeTabs} activeId={rangeId} onSelect={(id) => setRangeId(id as AnalyticsRangeId)} />
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <div className="mb-4">
            <span className="text-[11px] font-semibold tracking-[0.06em] text-canteen-dark uppercase">Revenue</span>
            <p className="font-display text-[34px] tracking-tight text-ink tabular-nums">
              {formatNaira(reports.totalRevenue)}
            </p>
          </div>
          <TrendChart data={revenueSeries} height={220} formatValue={(v) => formatNaira(v)} />
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-[11px] font-semibold tracking-[0.06em] text-canteen-dark uppercase">Total revenue</p>
            <p className="font-display mt-1 text-2xl tracking-tight text-ink tabular-nums">
              {formatNaira(reports.totalRevenue)}
            </p>
            <Sparkline data={revenueSeries} height={28} />
          </Card>
          <Card>
            <p className="text-[11px] font-semibold tracking-[0.06em] text-canteen-dark uppercase">Total orders</p>
            <p className="font-display mt-1 text-2xl tracking-tight text-ink tabular-nums">{reports.totalOrders}</p>
          </Card>
          <Card>
            <p className="text-[11px] font-semibold tracking-[0.06em] text-canteen-dark uppercase">Avg. order value</p>
            <p className="font-display mt-1 text-2xl tracking-tight text-ink tabular-nums">
              {formatNaira(avgOrderValue)}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <h2 className="mb-3 font-semibold text-ink">Top items</h2>
            <BarChart data={topItemsData} formatValue={(v) => `${v} sold`} />
          </Card>
          <Card className="lg:col-span-5">
            <h2 className="mb-3 font-semibold text-ink">Busiest hours</h2>
            <BarChart data={hourlyData.slice(0, 6)} formatValue={(v) => `${v} order${v === 1 ? "" : "s"}`} />
          </Card>
        </div>
      </div>
    </div>
  );
}
