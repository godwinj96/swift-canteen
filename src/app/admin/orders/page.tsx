import { prisma } from "@/lib/prisma";
import { AdminOrdersClient } from "./AdminOrdersClient";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: { include: { item: true } }, payment: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminOrdersClient
      orders={orders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt.toISOString(),
        customerName: o.user.fullName,
        itemCount: o.items.length,
        paymentStatus: o.payment?.status ?? null,
      }))}
    />
  );
}
