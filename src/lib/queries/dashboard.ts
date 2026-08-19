import { useQuery, type QueryClient } from "@tanstack/react-query";

export interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  totalMenuItems: number;
}

export interface DashboardReports {
  revenueByDay: { date: string; revenue: number }[];
  topItems: { itemId: string; name: string; quantitySold: number }[];
  totalRevenue: number;
  totalOrders: number;
}

export const dashboardStatsQueryKey = ["admin", "dashboardStats"] as const;
export const dashboardReportsQueryKey = ["admin", "dashboardReports"] as const;

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load dashboard stats");
  return {
    todayOrders: data.todayOrders,
    pendingOrders: data.pendingOrders,
    todayRevenue: Number(data.todayRevenue),
    totalMenuItems: data.totalMenuItems,
  };
}

async function fetchDashboardReports(): Promise<DashboardReports> {
  const res = await fetch("/api/dashboard/reports");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load reports");
  return data;
}

export function prefetchDashboard(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({ queryKey: dashboardStatsQueryKey, queryFn: fetchDashboardStats }),
    queryClient.prefetchQuery({ queryKey: dashboardReportsQueryKey, queryFn: fetchDashboardReports }),
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

export function useDashboardReports(initialData?: DashboardReports) {
  return useQuery({
    queryKey: dashboardReportsQueryKey,
    queryFn: fetchDashboardReports,
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}
