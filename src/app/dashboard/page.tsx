import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { listOrdersForUser, getRecentlyOrderedItems } from "@/lib/orders/service";
import { DashboardClient } from "./DashboardClient";

const PENDING_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"];

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const [profile, orders, recentItems] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.sub }, select: { fullName: true } }),
    listOrdersForUser(user.sub, user.role),
    getRecentlyOrderedItems(user.sub, 6),
  ]);

  const pendingOrders = orders
    .filter((order) => PENDING_STATUSES.includes(order.status))
    .map((order) => ({
      id: order.id,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      itemCount: order.items.length,
      paymentStatus: order.payment?.status ?? null,
    }))
    // Ready-for-pickup orders are the most actionable ("go get your food now") — surface first.
    .sort((a, b) => Number(b.status === "READY_FOR_PICKUP") - Number(a.status === "READY_FOR_PICKUP"));

  return (
    <DashboardClient
      firstName={profile?.fullName?.split(" ")[0] ?? "there"}
      pendingOrders={pendingOrders}
      recentItems={recentItems}
    />
  );
}
