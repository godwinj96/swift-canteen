import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

export interface AdminOrderRow {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  customerName: string;
  itemCount: number;
  paymentStatus: PaymentStatus | null;
}

interface RawAdminOrder {
  id: string;
  status: OrderStatus;
  totalAmount: string | number;
  createdAt: string;
  items: unknown[];
  payment: { status: PaymentStatus } | null;
  user: { fullName: string };
}

function normalizeAdminOrder(order: RawAdminOrder): AdminOrderRow {
  return {
    id: order.id,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt,
    customerName: order.user.fullName,
    itemCount: order.items.length,
    paymentStatus: order.payment?.status ?? null,
  };
}

export const adminOrdersQueryKey = ["admin", "orders"] as const;

async function fetchAdminOrders(): Promise<AdminOrderRow[]> {
  const res = await fetch("/api/admin/orders");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load orders");
  return data.orders.map(normalizeAdminOrder);
}

export function prefetchAdminOrders(queryClient: QueryClient) {
  return queryClient.prefetchQuery({ queryKey: adminOrdersQueryKey, queryFn: fetchAdminOrders });
}

export function useAdminOrders(initialData?: AdminOrderRow[]) {
  return useQuery({
    queryKey: adminOrdersQueryKey,
    queryFn: fetchAdminOrders,
    initialData,
    staleTime: 15 * 1000,
  });
}

export function useAdvanceOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update order status");
      return { orderId, status };
    },
    onSuccess: ({ orderId, status }) => {
      queryClient.setQueryData<AdminOrderRow[]>(adminOrdersQueryKey, (orders) =>
        orders?.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
    },
  });
}
