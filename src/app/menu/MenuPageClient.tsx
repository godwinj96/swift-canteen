"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryTabs } from "./_components/CategoryTabs";
import { MenuGrid } from "./_components/MenuGrid";
import { CartDrawer } from "./_components/CartDrawer";
import { useAddToCart, useCart, useRemoveCartItem, useUpdateCartItem, type CartItemData } from "@/lib/queries/cart";

interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
}

interface MenuPageClientProps {
  categories: Category[];
  items: MenuItemData[];
  initialCartItems: CartItemData[];
  isLoggedIn: boolean;
}

export function MenuPageClient({ categories, items, initialCartItems, isLoggedIn }: MenuPageClientProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { data: cartItems = initialCartItems } = useCart(isLoggedIn ? initialCartItems : []);
  const addToCart = useAddToCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const filteredItems = useMemo(
    () => (activeCategory ? items.filter((i) => i.categoryId === activeCategory) : items),
    [items, activeCategory]
  );

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  async function handleAdd(itemId: string) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    try {
      await addToCart.mutateAsync({ itemId, quantity: 1 });
      setCartOpen(true);
    } catch {
      // surfaced via the global mutation error toast
    }
  }

  async function handleUpdateQuantity(cartItemId: string, quantity: number) {
    try {
      await updateCartItem.mutateAsync({ cartItemId, quantity });
    } catch {
      // surfaced via the global mutation error toast
    }
  }

  async function handleRemove(cartItemId: string) {
    try {
      await removeCartItem.mutateAsync(cartItemId);
    } catch {
      // surfaced via the global mutation error toast
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 py-8">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
            Today&apos;s menu
          </span>
          <h1 className="font-display text-5xl tracking-tight text-ink">What are we having?</h1>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="flex shrink-0 items-center gap-2.5 rounded-full bg-ink px-5 py-3.5 font-semibold text-white hover:bg-canteen-dark"
        >
          Cart
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-canteen text-xs font-bold">
            {cartCount}
          </span>
        </button>
      </div>
      <div className="mb-8">
        <CategoryTabs categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />
      </div>
      <MenuGrid items={filteredItems} onAdd={handleAdd} />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
      />
    </div>
  );
}
