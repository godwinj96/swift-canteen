"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { PrefetchLink } from "@/components/layout/PrefetchLink";
import { formatNaira } from "@/lib/currency";
import { addLocalCartItem } from "@/lib/cart/localCart";
import { prefetchOrderDetail } from "@/lib/queries/orderDetail";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

interface PendingOrder {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  paymentStatus: PaymentStatus | null;
}

interface RecentItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface DashboardClientProps {
  firstName: string;
  pendingOrders: PendingOrder[];
  recentItems: RecentItem[];
}

function handleQuickAdd(item: RecentItem) {
  if (!item.isAvailable) return;
  addLocalCartItem(item.id, 1);
  toast.success(`${item.name} added to cart.`);
}

export function DashboardClient({ firstName, pendingOrders, recentItems }: DashboardClientProps) {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 py-12">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">Welcome back</span>
          <h1 className="font-display mt-2 text-4xl tracking-tight text-ink">Hi, {firstName}</h1>
        </div>
        <PrefetchLink
          href="/menu"
          className="inline-flex items-center justify-center rounded-full bg-canteen px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-canteen-dark"
        >
          Browse full menu →
        </PrefetchLink>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-ink">Your orders</h2>
        {pendingOrders.length === 0 ? (
          <Card className="text-sm text-muted">
            No active orders right now. <Link href="/menu" className="font-semibold text-canteen hover:underline">Browse the menu</Link> to place one.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingOrders.map((order) => {
              const ready = order.status === "READY_FOR_PICKUP";
              return (
                <PrefetchLink
                  key={order.id}
                  href={`/orders/${order.id}`}
                  prefetchData={(qc) =>
                    prefetchOrderDetail(qc, order.id)
                  }
                >
                  <Card
                    className={`flex items-center justify-between hover:shadow-md hover:shadow-canteen/10 hover:outline hover:outline-canteen ${
                      ready ? "border-2 border-canteen bg-canteen-light" : ""
                    }`}
                  >
                    <div>
                      {ready && <p className="mb-1 text-xs font-bold text-canteen-dark uppercase">Ready for pickup!</p>}
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
              );
            })}
          </div>
        )}
      </section>

      {recentItems.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-ink">Order again</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleQuickAdd(item)}
                disabled={!item.isAvailable}
                className="flex w-40 shrink-0 flex-col gap-2 rounded-2xl bg-canteen-light p-3 text-left transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={200}
                    height={100}
                    className="h-[100px] w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-[100px] w-full items-center justify-center rounded-xl bg-[#FDE9D4]">
                    <span className="text-2xl">🍽️</span>
                  </div>
                )}
                <p className="text-sm font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-muted">{item.isAvailable ? formatNaira(item.price) : "Unavailable"}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="flex gap-4">
        <Link href="/orders" className="text-sm font-semibold text-canteen hover:underline">
          Order history
        </Link>
        <Link href="/account" className="text-sm font-semibold text-canteen hover:underline">
          Account settings
        </Link>
      </section>
    </div>
  );
}
