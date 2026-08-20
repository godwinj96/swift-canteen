"use client";

import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { PaymentStatusBadge, OrderStatusBadge } from "@/components/ui/Badge";
import { OrderStatusTrack } from "@/components/ui/OrderStatusTrack";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { PrefetchLink } from "@/components/layout/PrefetchLink";
import { formatNaira } from "@/lib/currency";
import { addLocalCartItem } from "@/lib/cart/localCart";
import { prefetchOrderDetail } from "@/lib/queries/orderDetail";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

interface HeroOrder {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
}

interface HistoryOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  totalAmount: number;
  items: { name: string; quantity: number }[];
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
  heroOrder: HeroOrder | null;
  historyOrders: HistoryOrder[];
  recentItems: RecentItem[];
}

const HERO_HEADLINE: Partial<Record<OrderStatus, string>> = {
  PENDING: "We've got your order",
  CONFIRMED: "Preparing your order",
  PREPARING: "Preparing your order",
  READY_FOR_PICKUP: "Your order is ready for pickup!",
};

function handleQuickAdd(item: RecentItem) {
  if (!item.isAvailable) return;
  addLocalCartItem(item.id, 1);
  toast.success(`${item.name} added to cart.`);
}

function itemSummary(items: HistoryOrder["items"]): string {
  return items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
}

export function DashboardClient({ firstName, heroOrder, historyOrders, recentItems }: DashboardClientProps) {
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

      {/* Hero — the single most relevant order, occupying the page's only
          -md elevation. Dominates by design: this is "what's happening right
          now," not one card among equals in a list. */}
      {heroOrder ? (
        <PrefetchLink
          href={`/orders/${heroOrder.id}`}
          prefetchData={(qc) => prefetchOrderDetail(qc, heroOrder.id)}
          className="shadow-elevation-md mb-10 block rounded-2xl bg-canteen-light p-6"
        >
          <p className="font-display text-2xl tracking-tight text-ink">{HERO_HEADLINE[heroOrder.status]}</p>
          <p className="mt-1 mb-5 text-sm text-muted">
            Order #{heroOrder.id.slice(-8)} · {heroOrder.itemCount} item(s) · {formatNaira(heroOrder.totalAmount)}
          </p>
          <OrderStatusTrack status={heroOrder.status} />
        </PrefetchLink>
      ) : (
        <div className="mb-10 rounded-2xl border border-line px-6 py-4 text-sm text-muted">
          No active order right now — see your usuals below, or{" "}
          <Link href="/menu" className="font-semibold text-canteen hover:underline">
            browse the menu
          </Link>
          .
        </div>
      )}

      {/* "Order Again" — a real grid module, not a horizontal afterthought
          strip, given equal section-header weight to Order history below to
          signal it's a primary module, not secondary content. */}
      {recentItems.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Order again</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {recentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleQuickAdd(item)}
                disabled={!item.isAvailable}
                className="shadow-elevation-sm flex flex-col gap-2 rounded-xl bg-white p-3 text-left transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={200}
                    height={100}
                    className="h-[90px] w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-[90px] w-full items-center justify-center rounded-lg bg-canteen-light">
                    <span className="text-2xl">🍽️</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-muted">{item.isAvailable ? formatNaira(item.price) : "Unavailable"}</p>
                  </div>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canteen text-sm font-bold text-white">
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Order history — demoted into the same dense-table convention as the
          admin order queue, deliberately: this is what stops it from reading
          as "a duplicate orders page," a container change even though the
          underlying data is similar. */}
      <section>
        <h2 className="mb-4 text-[13px] font-semibold tracking-[0.06em] text-muted uppercase">Order history</h2>
        {historyOrders.length === 0 ? (
          <p className="text-sm text-muted">No past orders yet.</p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Order</TableHeaderCell>
                <TableHeaderCell>Items</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {historyOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-ink">#{order.id.slice(-8)}</span>
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-1 text-xs text-muted">{itemSummary(order.items)}</p>
                  </TableCell>
                  <TableCell>
                    <span className="tabular-nums">{formatNaira(order.totalAmount)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <OrderStatusBadge status={order.status} />
                      {order.paymentStatus && <PaymentStatusBadge status={order.paymentStatus} />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/orders/${order.id}`} className="text-sm font-semibold text-canteen hover:underline">
                      View →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <div className="mt-8">
        <Link href="/account" className="text-sm font-semibold text-canteen hover:underline">
          Account settings
        </Link>
      </div>
    </div>
  );
}
