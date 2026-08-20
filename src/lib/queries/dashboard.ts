import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { OrderStatus } from "@prisma/client";

export interface DashboardStats {
  todayOrders: number;
  ordersAwaitingAcceptance: number;
  pendingOrders: number;
  todayRevenue: number;
  totalMenuItems: number;
  revenueTrend: { date: string; revenue: number; orders: number }[];
}

export interface DashboardReports {
  revenueByDay: { date: string; revenue: number }[];
  ordersByHour: { hour: number; count: number }[];
  topItems: { itemId: string; name: string; quantitySold: number }[];
  totalRevenue: number;
  totalOrders: number;
}

export interface OrderActivityItem {
  orderId: string;
  status: OrderStatus;
  customerName: string;
  updatedAt: string;
}

export const dashboardStatsQueryKey = ["admin", "dashboardStats"] as const;
export const dashboardReportsQueryKey = ["admin", "dashboardReports"] as const;
export const dashboardActivityQueryKey = ["admin", "dashboardActivity"] as const;

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load dashboard stats");
  return {
    todayOrders: data.todayOrders,
    ordersAwaitingAcceptance: data.ordersAwaitingAcceptance,
    pendingOrders: data.pendingOrders,
    todayRevenue: Number(data.todayRevenue),
    totalMenuItems: data.totalMenuItems,
    revenueTrend: data.revenueTrend,
  };
}

export interface DateRange {
  from: string | null;
  to: string | null;
}

async function fetchDashboardReports(range?: DateRange): Promise<DashboardReports> {
  const params = new URLSearchParams();
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  const query = params.toString();
  const res = await fetch(`/api/dashboard/reports${query ? `?${query}` : ""}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load reports");
  return data;
}

async function fetchDashboardActivity(): Promise<OrderActivityItem[]> {
  const res = await fetch("/api/dashboard/activity");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load recent activity");
  return data.activity;
}

export function prefetchDashboard(queryClient: QueryClient, defaultReportsRange?: DateRange) {
  const range = defaultReportsRange ?? { from: null, to: null };
  return Promise.all([
    queryClient.prefetchQuery({ queryKey: dashboardStatsQueryKey, queryFn: fetchDashboardStats }),
    queryClient.prefetchQuery({
      queryKey: [...dashboardReportsQueryKey, range.from, range.to],
      queryFn: () => fetchDashboardReports(range),
    }),
    queryClient.prefetchQuery({ queryKey: dashboardActivityQueryKey, queryFn: fetchDashboardActivity }),
  ]);
}

export function useDashboardStats(initialData?: DashboardStats) {
  return useQuery({
    queryKey: dashboardStatsQueryKey,
    queryFn: fetchDashboardStats,
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardReports(range: DateRange, initialData?: DashboardReports) {
  const isDefaultRange = range.from === null && range.to === null;
  return useQuery({
    queryKey: [...dashboardReportsQueryKey, range.from, range.to],
    queryFn: () => fetchDashboardReports(range),
    initialData: isDefaultRange ? initialData : undefined,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardActivity(initialData?: OrderActivityItem[]) {
  return useQuery({
    queryKey: dashboardActivityQueryKey,
    queryFn: fetchDashboardActivity,
    initialData,
    staleTime: 60 * 1000,
  });
}
