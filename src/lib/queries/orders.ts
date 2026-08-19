import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  paymentStatus: PaymentStatus | null;
}

interface RawOrder {
  id: string;
  status: OrderStatus;
  totalAmount: string | number;
  items: unknown[];
  payment: { status: PaymentStatus } | null;
}

function normalizeOrder(order: RawOrder): OrderSummary {
  return {
    id: order.id,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    itemCount: order.items.length,
    paymentStatus: order.payment?.status ?? null,
  };
}

export const ordersQueryKey = ["orders"] as const;

async function fetchOrders(): Promise<OrderSummary[]> {
  const res = await fetch("/api/orders");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load orders");
  return data.orders.map(normalizeOrder);
}

export function prefetchOrders(queryClient: QueryClient) {
  return queryClient.prefetchQuery({ queryKey: ordersQueryKey, queryFn: fetchOrders });
}

export function useOrders(initialData?: OrderSummary[]) {
  return useQuery({ queryKey: ordersQueryKey, queryFn: fetchOrders, initialData });
}
