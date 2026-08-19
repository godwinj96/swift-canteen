import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOrderById } from "@/lib/orders/service";
import { ApiError } from "@/lib/errors";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatNaira } from "@/lib/currency";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED"] as const;

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
  const currentStepIndex = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-8 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tight text-ink">Order #{order.id.slice(-8)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status !== "CANCELLED" && (
        <div className="mb-8 flex items-center justify-between">
          {STATUS_STEPS.map((step, idx) => (
            <div key={step} className="flex flex-1 flex-col items-center text-center">
              <div
                className={`mb-1 h-3 w-3 rounded-full ${
                  idx <= currentStepIndex ? "bg-canteen" : "bg-line"
                }`}
              />
              <span className="text-[10px] text-muted">{step.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}

      <Card className="mb-4">
        <h2 className="mb-3 font-semibold text-ink">Items</h2>
        <ul className="flex flex-col gap-2 text-sm text-ink">
          {order.items.map((oi) => (
            <li key={oi.id} className="flex justify-between">
              <span>
                {oi.quantity}× {oi.item.name}
              </span>
              <span>{formatNaira(Number(oi.unitPrice) * oi.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-semibold text-ink">
          <span>Total</span>
          <span>{formatNaira(Number(order.totalAmount))}</span>
        </div>
      </Card>

      {order.payment && (
        <Card className="flex items-center justify-between">
          <span className="text-sm text-muted">Payment status</span>
          <PaymentStatusBadge status={order.payment.status} />
        </Card>
      )}
    </div>
  );
}
