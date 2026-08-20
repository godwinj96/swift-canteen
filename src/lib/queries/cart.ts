import { useQuery, type QueryClient } from "@tanstack/react-query";

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

/**
 * Read-only cart cache, used only to warm data ahead of navigation
 * (see PrefetchLink/RolePrefetcher) and for the one-time hydration read in
 * useLocalCart. The cart itself is client-owned/local-first — see
 * src/lib/cart/useLocalCart.ts — so there are no mutation hooks here.
 */
export function useCart(initialData?: CartItemData[]) {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: fetchCart,
    initialData,
  });
}
