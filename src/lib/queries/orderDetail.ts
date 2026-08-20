import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  items: { id: string; quantity: number; unitPrice: number; item: { name: string } }[];
  payment: { id: string; status: PaymentStatus } | null;
}

interface RawOrderDetail {
  id: string;
  status: OrderStatus;
  totalAmount: string | number;
  items: { id: string; quantity: number; unitPrice: string | number; item: { name: string } }[];
  payment: { id: string; status: PaymentStatus } | null;
}

function normalizeOrderDetail(order: RawOrderDetail): OrderDetail {
  return {
    id: order.id,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    items: order.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      item: { name: i.item.name },
    })),
    payment: order.payment,
  };
}

export function orderDetailQueryKey(orderId: string) {
  return ["orders", orderId] as const;
}

async function fetchOrderDetail(orderId: string): Promise<OrderDetail> {
  const res = await fetch(`/api/orders/${orderId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load order");
  return normalizeOrderDetail(data.order);
}

export function prefetchOrderDetail(queryClient: QueryClient, orderId: string) {
  return queryClient.prefetchQuery({
    queryKey: orderDetailQueryKey(orderId),
    queryFn: () => fetchOrderDetail(orderId),
  });
}

const PAYMENT_PENDING_STATUSES: PaymentStatus[] = ["INITIATED", "PENDING"];

export function useOrderDetail(orderId: string, initialData: OrderDetail) {
  return useQuery({
    queryKey: orderDetailQueryKey(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    initialData,
    refetchInterval: (query) => {
      const status = query.state.data?.payment?.status;
      return status && PAYMENT_PENDING_STATUSES.includes(status) ? 4000 : false;
    },
  });
}

export function useRetryPayment(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start payment");
      return data as { checkoutUrl: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderDetailQueryKey(orderId) });
    },
  });
}
