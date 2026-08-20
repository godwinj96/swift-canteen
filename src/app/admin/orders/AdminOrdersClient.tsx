"use client";

import { useEffect, useMemo, useState } from "react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import type { OrderStatus } from "@prisma/client";
import { formatNaira } from "@/lib/currency";
import { canTransitionOrder } from "@/lib/orders/stateMachine";
import { useAdminOrders, useAdvanceOrderStatus, type AdminOrderRow } from "@/lib/queries/adminOrders";
import { useNow } from "@/lib/hooks/useNow";

// Replaces the earlier Kanban-column layout: per Toast/Square/DoorDash's
// order-management pattern, a queue that has to scale past a handful of
// concurrent orders needs status TABS over one scannable list, not parallel
// columns you scroll sideways through. Tab names map UNIBEN-canteen-scale
// stages onto the researched pattern (Toast's "Needs Approval / Active /
// Ready / Completed"): CONFIRMED and PREPARING share a tab since both are
// "being worked, not yet ready" from an admin's point of view.
type QueueTabId = "needsAcceptance" | "preparing" | "ready" | "completed";

const TAB_STATUSES: Record<QueueTabId, OrderStatus[]> = {
  needsAcceptance: ["PENDING"],
  preparing: ["CONFIRMED", "PREPARING"],
  ready: ["READY_FOR_PICKUP"],
  completed: ["COMPLETED", "CANCELLED"],
};

const TAB_ORDER: QueueTabId[] = ["needsAcceptance", "preparing", "ready", "completed"];
const TAB_LABELS: Record<QueueTabId, string> = {
  needsAcceptance: "Needs Acceptance",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
};

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

const AMBER_AFTER_MINUTES = 10;
const RED_AFTER_MINUTES = 20;
const SEEN_ORDERS_KEY = "swift-canteen-admin-seen-orders";

function ElapsedChip({ createdAt }: { createdAt: string }) {
  const now = useNow(30000);
  if (now === null) {
    return <span className="inline-flex items-center rounded-full bg-line px-2 py-0.5 text-[11px] font-semibold text-muted">—</span>;
  }
  const minutes = Math.max(0, Math.round((now - new Date(createdAt).getTime()) / 60000));
  const classes =
    minutes >= RED_AFTER_MINUTES
      ? "bg-canteen text-white"
      : minutes >= AMBER_AFTER_MINUTES
        ? "bg-canteen-light text-canteen-dark"
        : "bg-line text-muted";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${classes}`}>
      {minutes < 1 ? "just now" : `${minutes}m ago`}
    </span>
  );
}

function itemSummary(items: AdminOrderRow["items"]): string {
  return items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
}

function readSeenOrders(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(SEEN_ORDERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function AdminOrdersClient({ orders: initialOrders }: { orders: AdminOrderRow[] }) {
  const { data: orders = initialOrders } = useAdminOrders(initialOrders);
  const advanceStatus = useAdvanceOrderStatus();
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [seenOrders, setSeenOrders] = useState<Set<string>>(() => new Set());
  const [activeTab, setActiveTab] = useState<QueueTabId | null>(null);

  useEffect(() => {
    // Nested in a rAF callback (not called synchronously in the effect body)
    // so this is a post-hydration settle, not a same-tick cascading render.
    const id = requestAnimationFrame(() => setSeenOrders(readSeenOrders()));
    return () => cancelAnimationFrame(id);
  }, []);

  const countsByTab = useMemo(() => {
    const counts: Record<QueueTabId, number> = { needsAcceptance: 0, preparing: 0, ready: 0, completed: 0 };
    for (const order of orders) {
      const tab = TAB_ORDER.find((id) => TAB_STATUSES[id].includes(order.status));
      if (tab) counts[tab]++;
    }
    return counts;
  }, [orders]);

  // Default to the most-actionable tab, falling back if it's empty — per
  // Toast's "opens on Needs Approval" finding — computed once counts are
  // known rather than hardcoded, so an empty queue doesn't open on a dead tab.
  useEffect(() => {
    if (activeTab !== null) return;
    const id = requestAnimationFrame(() => {
      if (countsByTab.needsAcceptance > 0) setActiveTab("needsAcceptance");
      else if (countsByTab.preparing > 0) setActiveTab("preparing");
      else setActiveTab("needsAcceptance");
    });
    return () => cancelAnimationFrame(id);
  }, [activeTab, countsByTab]);

  const resolvedTab = activeTab ?? "needsAcceptance";

  const tabs: TabItem[] = TAB_ORDER.map((id) => ({
    id,
    label: TAB_LABELS[id],
    count: countsByTab[id],
    hot: id === "needsAcceptance",
  }));

  const query = search.trim().toLowerCase();
  const visibleOrders = orders
    .filter((order) => TAB_STATUSES[resolvedTab].includes(order.status))
    .filter((order) => {
      if (!query) return true;
      return order.id.toLowerCase().includes(query) || order.customerName.toLowerCase().includes(query);
    });

  function markSeen(orderId: string) {
    if (seenOrders.has(orderId)) return;
    const next = new Set(seenOrders).add(orderId);
    setSeenOrders(next);
    try {
      window.sessionStorage.setItem(SEEN_ORDERS_KEY, JSON.stringify([...next]));
    } catch {
      // sessionStorage unavailable — the dot just won't persist across reloads, non-critical
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">Live queue</span>
          <h1 className="font-display mt-2 text-4xl tracking-tight text-ink">Order Queue</h1>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order # or customer"
          className="w-full max-w-xs rounded-full border border-line px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-canteen focus:outline-none"
        />
      </div>

      <div className="mb-6">
        <Tabs tabs={tabs} activeId={resolvedTab} onSelect={(id) => setActiveTab(id as QueueTabId)} />
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Order</TableHeaderCell>
            <TableHeaderCell>Customer &amp; items</TableHeaderCell>
            <TableHeaderCell>Elapsed</TableHeaderCell>
            <TableHeaderCell>Payment</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleOrders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted">
                No orders in this tab.
              </TableCell>
            </TableRow>
          )}
          {visibleOrders.map((order) => {
            const nextStatus = NEXT_STATUS[order.status];
            const canCancel = canTransitionOrder(order.status, "CANCELLED");
            const isUnseen = resolvedTab === "needsAcceptance" && !seenOrders.has(order.id);
            return (
              <TableRow key={order.id} onMouseEnter={() => markSeen(order.id)}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isUnseen && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-canteen" aria-label="New" />}
                    <span className="font-mono font-bold text-ink">#{order.id.slice(-8)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-ink">{order.customerName}</p>
                  {order.items.length > 0 && (
                    <p className="line-clamp-1 text-xs text-muted">{itemSummary(order.items)}</p>
                  )}
                </TableCell>
                <TableCell>
                  <ElapsedChip createdAt={order.createdAt} />
                </TableCell>
                <TableCell>{order.paymentStatus ? <PaymentStatusBadge status={order.paymentStatus} /> : "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-semibold text-ink tabular-nums">{formatNaira(order.totalAmount)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {nextStatus && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => advanceStatus.mutate({ orderId: order.id, status: nextStatus })}
                        disabled={advanceStatus.isPending}
                      >
                        {ACTION_LABEL[order.status]}
                      </Button>
                    )}
                    {canCancel && (
                      <Button variant="ghost" size="sm" onClick={() => setPendingCancelId(order.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
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
