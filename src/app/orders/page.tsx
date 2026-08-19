import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listOrdersForUser } from "@/lib/orders/service";
import { OrdersPageClient } from "./OrdersPageClient";

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const orders = await listOrdersForUser(user.sub, user.role);

  return (
    <OrdersPageClient
      initialOrders={orders.map((order) => ({
        id: order.id,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        itemCount: order.items.length,
        paymentStatus: order.payment?.status ?? null,
      }))}
    />
  );
}
