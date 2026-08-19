import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOrderById } from "@/lib/orders/service";
import { ApiError } from "@/lib/errors";
import { OrderDetailClient } from "./OrderDetailClient";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  let order: Awaited<ReturnType<typeof getOrderById>>;
  try {
    order = await getOrderById(id, user.sub, user.role);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      notFound();
    }
    throw error;
  }

  return (
    <OrderDetailClient
      initialOrder={{
        id: order.id,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((oi) => ({
          id: oi.id,
          quantity: oi.quantity,
          unitPrice: Number(oi.unitPrice),
          item: { name: oi.item.name },
        })),
        payment: order.payment ? { id: order.payment.id, status: order.payment.status } : null,
      }}
    />
  );
}
