"use client";

import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PrefetchLink } from "@/components/layout/PrefetchLink";
import { formatNaira } from "@/lib/currency";
import { useOrders, type OrderSummary } from "@/lib/queries/orders";
import { prefetchOrderDetail } from "@/lib/queries/orderDetail";

export function OrdersPageClient({ initialOrders }: { initialOrders: OrderSummary[] }) {
  const { data: orders = initialOrders } = useOrders(initialOrders);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-8 py-12">
      <h1 className="font-display mb-8 text-4xl tracking-tight text-ink">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-muted">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <PrefetchLink
              key={order.id}
              href={`/orders/${order.id}`}
              prefetchData={(qc) => prefetchOrderDetail(qc, order.id)}
            >
              <Card className="flex items-center justify-between hover:bg-white hover:shadow-md hover:shadow-canteen/10 hover:outline hover:outline-canteen">
                <div>
                  <p className="font-medium text-ink">Order #{order.id.slice(-8)}</p>
                  <p className="text-sm text-muted">
                    {order.itemCount} item(s) · {formatNaira(order.totalAmount)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {order.paymentStatus && <PaymentStatusBadge status={order.paymentStatus} />}
                  <OrderStatusBadge status={order.status} />
                </div>
              </Card>
            </PrefetchLink>
          ))}
        </div>
      )}
    </div>
  );
}
