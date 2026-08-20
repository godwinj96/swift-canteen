"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TrendChart } from "@/components/charts/TrendChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { formatNaira } from "@/lib/currency";
import {
  useDashboardStats,
  useDashboardActivity,
  type DashboardStats,
  type OrderActivityItem,
} from "@/lib/queries/dashboard";
import { useNow } from "@/lib/hooks/useNow";
import type { OrderStatus } from "@prisma/client";

const ACTIVITY_LABEL: Record<OrderStatus, string> = {
  PENDING: "placed",
  CONFIRMED: "accepted",
  PREPARING: "marked preparing",
  READY_FOR_PICKUP: "marked ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Takes `now` as a param (from the shared useNow() hook) rather than calling
// Date.now() itself — see useNow's docstring for why that matters for SSR.
function relativeTime(iso: string, now: number): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

/** Compares the latest trend point against the previous one; null when there isn't enough data. */
function computeTrend(series: { value: number }[]): { percent: number; up: boolean } | null {
  if (series.length < 2) return null;
  const latest = series[series.length - 1].value;
  const previous = series[series.length - 2].value;
  if (previous === 0) return null;
  const percent = ((latest - previous) / previous) * 100;
  return { percent: Math.round(Math.abs(percent)), up: percent >= 0 };
}

function TrendLabel({ trend }: { trend: { percent: number; up: boolean } | null }) {
  if (!trend) return null;
  return (
    <span className="text-xs font-medium text-muted">
      {trend.up ? "↑" : "▼"} {trend.percent}%
    </span>
  );
}

interface KpiTileProps {
  label: string;
  value: string;
  trend?: { percent: number; up: boolean } | null;
  sparklineData?: { label: string; value: number }[];
}

function KpiTile({ label, value, trend, sparklineData }: KpiTileProps) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold tracking-[0.06em] text-canteen-dark uppercase">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[26px] tracking-tight text-ink tabular-nums">{value}</span>
        <TrendLabel trend={trend ?? null} />
      </div>
      {sparklineData && sparklineData.length >= 2 && <Sparkline data={sparklineData} height={32} />}
    </Card>
  );
}

export function AdminDashboardClient({
  initialStats,
  initialActivity,
}: {
  initialStats: DashboardStats;
  initialActivity: OrderActivityItem[];
}) {
  const { data: stats = initialStats } = useDashboardStats(initialStats);
  const { data: activity = initialActivity } = useDashboardActivity(initialActivity);
  const now = useNow(60000);

  const revenueSeries = stats.revenueTrend.map((d) => ({ label: d.date.slice(5), value: d.revenue }));
  const orderCountSeries = stats.revenueTrend.map((d) => ({ label: d.date.slice(5), value: d.orders }));
  const revenueTrend = computeTrend(revenueSeries);
  const orderCountTrend = computeTrend(orderCountSeries);

  return (
    <div>
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">Overview</span>
      <h1 className="font-display mt-2 mb-8 text-4xl tracking-tight text-ink">Dashboard</h1>

      <div className="flex flex-col gap-8">
        {/* Row 1 — needs-attention banner. Collapses to a neutral confirmation
            when clear, per the "don't cry wolf" rule: orange only means something
            when it doesn't appear on every visit regardless of state. */}
        {stats.ordersAwaitingAcceptance > 0 ? (
          <div className="shadow-elevation-md flex flex-wrap items-center justify-between gap-4 rounded-2xl border-l-4 border-canteen bg-canteen-light p-6">
            <div>
              <p className="text-xl font-bold text-ink">
                {stats.ordersAwaitingAcceptance} order{stats.ordersAwaitingAcceptance === 1 ? "" : "s"} waiting to be
                accepted
              </p>
              <p className="text-sm text-muted">Head to the order queue to accept them.</p>
            </div>
            <Link
              href="/admin/orders"
              className="shrink-0 rounded-full bg-canteen px-5 py-2.5 text-sm font-semibold text-white hover:bg-canteen-dark"
            >
              Review queue →
            </Link>
          </div>
        ) : (
          <div className="flex items-center rounded-2xl border border-line bg-white px-6 py-3 text-sm text-muted">
            All caught up — no orders waiting to be accepted.
          </div>
        )}

        {/* Row 2 — anchor trend chart, the page's primary visual weight. */}
        <Card>
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] font-semibold tracking-[0.06em] text-canteen-dark uppercase">
                Revenue, last 7 days
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[34px] tracking-tight text-ink tabular-nums">
                  {formatNaira(stats.todayRevenue)}
                </span>
                <TrendLabel trend={revenueTrend} />
              </div>
            </div>
          </div>
          <TrendChart data={revenueSeries} height={160} formatValue={(v) => formatNaira(v)} />
        </Card>

        {/* Row 3 — sparkline-bearing KPI tiles (per design spec: never a bare
            number). "Active orders" and "Available items" are point-in-time
            gauges, not daily series, so they honestly show no sparkline rather
            than a fabricated trend. */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiTile label="Orders today" value={String(stats.todayOrders)} trend={orderCountTrend} sparklineData={orderCountSeries} />
          <KpiTile label="Active orders" value={String(stats.pendingOrders)} />
          <KpiTile label="Revenue today" value={formatNaira(stats.todayRevenue)} trend={revenueTrend} sparklineData={revenueSeries} />
          <KpiTile label="Available items" value={String(stats.totalMenuItems)} />
        </div>

        {/* Row 4 — recent activity feed + quick-action rail. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <h2 className="mb-3 font-semibold text-ink">Recent activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-muted">No activity yet.</p>
            ) : (
              <ul className="flex flex-col">
                {activity.map((item) => (
                  <li
                    key={item.orderId}
                    className={`flex items-center justify-between border-l-2 py-2.5 pl-3 text-sm ${
                      item.status === "PENDING" ? "border-canteen" : "border-line"
                    }`}
                  >
                    <span className="text-ink">
                      Order #{item.orderId.slice(-8)} ({item.customerName}) {ACTIVITY_LABEL[item.status]}
                    </span>
                    <span className="shrink-0 text-muted">{now === null ? "—" : relativeTime(item.updatedAt, now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="flex flex-col gap-2 lg:col-span-5">
            <h2 className="mb-1 font-semibold text-ink">Quick actions</h2>
            <Link href="/admin/orders" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-canteen-light">
              View order queue
            </Link>
            <Link href="/admin/menu" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-canteen-light">
              Add a menu item
            </Link>
            <Link href="/admin/reports" className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-canteen-light">
              Open analytics
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
