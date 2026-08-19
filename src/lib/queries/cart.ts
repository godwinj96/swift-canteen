import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

export interface CartItemData {
  id: string;
  quantity: number;
  item: { id: string; name: string; price: number };
}

interface RawCartItem {
  id: string;
  quantity: number;
  item: { id: string; name: string; price: string | number };
}

function normalizeCart(items: RawCartItem[]): CartItemData[] {
  return items.map((i) => ({
    id: i.id,
    quantity: i.quantity,
    item: { id: i.item.id, name: i.item.name, price: Number(i.item.price) },
  }));
}

export const cartQueryKey = ["cart"] as const;

async function fetchCart(): Promise<CartItemData[]> {
  const res = await fetch("/api/cart");
  if (!res.ok) return [];
  const data = await res.json();
  return normalizeCart(data.cart.items);
}

export function prefetchCart(queryClient: QueryClient) {
  return queryClient.prefetchQuery({ queryKey: cartQueryKey, queryFn: fetchCart });
}

export function useCart(initialData?: CartItemData[]) {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: fetchCart,
    initialData,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add item to cart");
      return normalizeCart(data.cart.items);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      const res = await fetch(`/api/cart/${cartItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update cart item");
      return normalizeCart(data.cart.items);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart);
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cartItemId: string) => {
      const res = await fetch(`/api/cart/${cartItemId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not remove cart item");
      return normalizeCart(data.cart.items);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart);
    },
  });
}
