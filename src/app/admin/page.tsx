import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./AdminDashboardClient";

async function getStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayOrders, pendingOrders, todayRevenue, totalMenuItems] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
    prisma.menuItem.count({ where: { isAvailable: true } }),
  ]);

  return {
    todayOrders,
    pendingOrders,
    todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
    totalMenuItems,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  return <AdminDashboardClient initialStats={stats} />;
}
