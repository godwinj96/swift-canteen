import { prisma } from "@/lib/prisma";
import { AdminReportsClient } from "./AdminReportsClient";

export default async function AdminReportsPage() {
  const [orders, topItems] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);

  const revenueByDay = new Map<string, number>();
  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(order.totalAmount));
  }

  const itemDetails = await prisma.menuItem.findMany({
    where: { id: { in: topItems.map((t) => t.itemId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(itemDetails.map((i) => [i.id, i.name]));

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <AdminReportsClient
      initialReports={{
        revenueByDay: Array.from(revenueByDay.entries()).map(([date, revenue]) => ({ date, revenue })),
        topItems: topItems.map((t) => ({
          itemId: t.itemId,
          name: nameById.get(t.itemId) ?? "Unknown",
          quantitySold: t._sum.quantity ?? 0,
        })),
        totalRevenue,
        totalOrders: orders.length,
      }}
    />
  );
}
