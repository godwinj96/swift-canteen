"use client";

import { useEffect, useState } from "react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { OrderStatus } from "@prisma/client";
import { formatNaira } from "@/lib/currency";
import { canTransitionOrder } from "@/lib/orders/stateMachine";
import { useAdminOrders, useAdvanceOrderStatus, type AdminOrderRow } from "@/lib/queries/adminOrders";

// The concrete fix for "orders are easy to mix up": one column per live
// stage (a kitchen-display-system board, not a flat table), each order
// rendered as a card with a large order number, an elapsed-time chip that
// escalates color the longer it's waited, and a single contextual action
// button — reusing the existing NEXT_STATUS/useAdvanceOrderStatus mutation,
// just exposing PENDING -> CONFIRMED, which the table view never did.
const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "New" },
  { status: "CONFIRMED", label: "Accepted" },
  { status: "PREPARING", label: "Preparing" },
  { status: "READY_FOR_PICKUP", label: "Ready for pickup" },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "COMPLETED",
};

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Accept",
  CONFIRMED: "Start preparing",
  PREPARING: "Mark ready",
  READY_FOR_PICKUP: "Complete",
};

const COLUMN_ACCENT: Record<OrderStatus, string> = {
  PENDING: "border-l-stone-400",
  CONFIRMED: "border-l-blue-400",
  PREPARING: "border-l-amber-400",
  READY_FOR_PICKUP: "border-l-purple-400",
  COMPLETED: "border-l-green-400",
  CANCELLED: "border-l-red-400",
};

const AMBER_AFTER_MINUTES = 10;
const RED_AFTER_MINUTES = 20;

// Ticks every 30s so the elapsed-time coloring stays live without a full
// order refetch — Date.now() itself is read inside the effect, not render.
function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function ElapsedChip({ createdAt }: { createdAt: string }) {
  const now = useNow(30000);
  const minutes = Math.max(0, Math.round((now - new Date(createdAt).getTime()) / 60000));
  const classes =
    minutes >= RED_AFTER_MINUTES
      ? "bg-red-100 text-red-700"
      : minutes >= AMBER_AFTER_MINUTES
        ? "bg-amber-100 text-amber-700"
        : "bg-stone-100 text-stone-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${classes}`}>
      {minutes < 1 ? "just now" : `${minutes}m ago`}
    </span>
  );
}

function itemSummary(items: AdminOrderRow["items"]): string {
  return items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
}

function OrderCard({
  order,
  onAdvance,
  onCancel,
  pending,
}: {
  order: AdminOrderRow;
  onAdvance: (status: OrderStatus) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const nextStatus = NEXT_STATUS[order.status];
  const canCancel = canTransitionOrder(order.status, "CANCELLED");

  return (
    <Card className={`border-l-4 p-4 ${COLUMN_ACCENT[order.status]}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="font-mono text-base font-bold text-ink">#{order.id.slice(-8)}</span>
        <ElapsedChip createdAt={order.createdAt} />
      </div>
      <p className="mb-1 text-sm font-semibold text-ink">{order.customerName}</p>
      {order.items.length > 0 && <p className="mb-2 line-clamp-2 text-xs text-muted">{itemSummary(order.items)}</p>}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-canteen-dark">{formatNaira(order.totalAmount)}</span>
        {order.paymentStatus && <PaymentStatusBadge status={order.paymentStatus} />}
      </div>
      <div className="flex gap-2">
        {nextStatus && (
          <Button variant="primary" size="sm" onClick={() => onAdvance(nextStatus)} disabled={pending} className="flex-1">
            {ACTION_LABEL[order.status]}
          </Button>
        )}
        {canCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

export function AdminOrdersClient({ orders: initialOrders }: { orders: AdminOrderRow[] }) {
  const { data: orders = initialOrders } = useAdminOrders(initialOrders);
  const advanceStatus = useAdvanceOrderStatus();
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const completedOrCancelled = orders.filter((o) => o.status === "COMPLETED" || o.status === "CANCELLED");

  return (
    <div>
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">Live queue</span>
      <h1 className="font-display mt-2 mb-8 text-4xl tracking-tight text-ink">Order Queue</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnOrders = orders.filter((o) => o.status === column.status);
          return (
            <div key={column.status} className="flex w-72 shrink-0 flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-ink">{column.label}</h2>
                <span className="text-xs font-medium text-muted">{columnOrders.length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {columnOrders.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-line p-4 text-center text-xs text-muted">
                    No orders here
                  </p>
                )}
                {columnOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    pending={advanceStatus.isPending}
                    onAdvance={(status) => advanceStatus.mutate({ orderId: order.id, status })}
                    onCancel={() => setPendingCancelId(order.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <button
          onClick={() => setShowCompleted((v) => !v)}
          className="text-sm font-semibold text-canteen hover:underline"
        >
          {showCompleted ? "Hide" : "Show"} completed &amp; cancelled ({completedOrCancelled.length})
        </button>
        {showCompleted && (
          <div className="mt-4 flex flex-col gap-2">
            {completedOrCancelled.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-ink">#{order.id.slice(-8)}</span>
                  <span className="text-sm text-muted">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-ink">{formatNaira(order.totalAmount)}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingCancelId !== null}
        title="Cancel this order?"
        description="The customer will see this order as cancelled. This can't be undone."
        confirmLabel="Cancel order"
        pending={advanceStatus.isPending}
        onConfirm={() => {
          if (!pendingCancelId) return;
          advanceStatus.mutate({ orderId: pendingCancelId, status: "CANCELLED" });
          setPendingCancelId(null);
        }}
        onCancel={() => setPendingCancelId(null)}
      />
    </div>
  );
}
