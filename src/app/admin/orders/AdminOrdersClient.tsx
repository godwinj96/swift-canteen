"use client";

import { useState } from "react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { OrderStatus } from "@prisma/client";
import { formatNaira } from "@/lib/currency";
import { useAdminOrders, useAdvanceOrderStatus, type AdminOrderRow } from "@/lib/queries/adminOrders";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMED: "PREPARING",
  PREPARING: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "COMPLETED",
};

export function AdminOrdersClient({ orders: initialOrders }: { orders: AdminOrderRow[] }) {
  const { data: orders = initialOrders } = useAdminOrders(initialOrders);
  const advanceStatus = useAdvanceOrderStatus();
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  return (
    <div>
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Live queue
      </span>
      <h1 className="font-display mt-2 mb-8 text-4xl tracking-tight text-ink">Order Queue</h1>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Order</TableHeaderCell>
            <TableHeaderCell>Customer</TableHeaderCell>
            <TableHeaderCell>Total</TableHeaderCell>
            <TableHeaderCell>Payment</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => {
            const nextStatus = NEXT_STATUS[order.status];
            return (
              <TableRow key={order.id}>
                <TableCell>#{order.id.slice(-8)}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{formatNaira(order.totalAmount)}</TableCell>
                <TableCell>
                  {order.paymentStatus ? <PaymentStatusBadge status={order.paymentStatus} /> : "—"}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="flex gap-2">
                  {nextStatus && (
                    <button
                      onClick={() => advanceStatus.mutate({ orderId: order.id, status: nextStatus })}
                      className="text-xs font-medium text-canteen hover:underline"
                    >
                      Mark {nextStatus.replace(/_/g, " ").toLowerCase()}
                    </button>
                  )}
                  {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                    <button
                      onClick={() => setPendingCancelId(order.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

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
