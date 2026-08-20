import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { listOrdersForUser, getRecentlyOrderedItems } from "@/lib/orders/service";
import { DashboardClient } from "./DashboardClient";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"];
// Ready-for-pickup is the most actionable state ("go get your food now"),
// then preparing/confirmed, then just-placed — used to pick the single
// order that earns the hero module when a customer has more than one
// active order at once.
const ACTIVE_PRIORITY: Record<string, number> = {
  READY_FOR_PICKUP: 0,
  PREPARING: 1,
  CONFIRMED: 1,
  PENDING: 2,
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const [profile, orders, recentItems] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.sub }, select: { fullName: true } }),
    listOrdersForUser(user.sub, user.role),
    getRecentlyOrderedItems(user.sub, 6),
  ]);

  const activeOrders = orders
    .filter((order) => ACTIVE_STATUSES.includes(order.status))
    .sort((a, b) => ACTIVE_PRIORITY[a.status] - ACTIVE_PRIORITY[b.status]);
  const heroOrder = activeOrders[0]
    ? {
        id: activeOrders[0].id,
        status: activeOrders[0].status,
        totalAmount: Number(activeOrders[0].totalAmount),
        itemCount: activeOrders[0].items.length,
      }
    : null;

  // Everything else — every order, active or not, minus the one already
  // promoted to the hero — goes in the demoted history table below.
  const historyOrders = orders
    .filter((order) => order.id !== heroOrder?.id)
    .map((order) => ({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      totalAmount: Number(order.totalAmount),
      items: order.items.map((oi) => ({ name: oi.item.name, quantity: oi.quantity })),
      paymentStatus: order.payment?.status ?? null,
    }));

  return (
    <DashboardClient
      firstName={profile?.fullName?.split(" ")[0] ?? "there"}
      heroOrder={heroOrder}
      historyOrders={historyOrders}
      recentItems={recentItems}
    />
  );
}
