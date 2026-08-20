"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CategoryTabs } from "./_components/CategoryTabs";
import { MenuGrid } from "./_components/MenuGrid";
import { CartDrawer } from "./_components/CartDrawer";
import { SearchInput } from "./_components/SearchInput";
import { useLocalCart } from "@/lib/cart/useLocalCart";
import { useDebounce } from "@/lib/hooks/useDebounce";

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 275;

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
  userId: string | null;
}

export function MenuPageClient({ categories, items, userId }: MenuPageClientProps) {
  const isLoggedIn = userId !== null;
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  const cart = useLocalCart(userId);

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const cartLines = useMemo(
    () =>
      cart.lines
        .map((line) => {
          const item = itemsById.get(line.itemId);
          return item ? { itemId: line.itemId, quantity: line.quantity, item } : null;
        })
        .filter((line): line is { itemId: string; quantity: number; item: MenuItemData } => line !== null),
    [cart.lines, itemsById]
  );

  const filteredItems = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory && item.categoryId !== activeCategory) return false;
      if (!query) return true;
      return item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
    });
  }, [items, activeCategory, debouncedSearch]);

  const visibleItems = filteredItems.slice(0, visibleCount);

  // Reset pagination whenever the active filter set changes (adjusting state
  // during render rather than in an effect — see react.dev/learn/you-might-not-need-an-effect)
  const filterKey = `${activeCategory ?? "all"}::${debouncedSearch}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  function handleAdd(itemId: string) {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent("/menu")}`);
      return;
    }
    const item = itemsById.get(itemId);
    if (!item?.isAvailable) {
      toast.error("That item isn't available right now.");
      return;
    }
    cart.addItem(itemId, 1);
    toast.success(`${item.name} added to cart.`);
    setCartOpen(true);
  }

  function handleUpdateQuantity(itemId: string, quantity: number) {
    cart.updateQuantity(itemId, quantity);
  }

  function handleRemove(itemId: string) {
    cart.removeItem(itemId);
  }

  async function handleCheckout() {
    await cart.forceSyncNow();
    router.push("/checkout");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
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
            {cart.count}
          </span>
        </button>
      </div>
      <div className="mb-6">
        <SearchInput value={searchInput} onChange={setSearchInput} />
      </div>
      <div className="mb-8">
        <CategoryTabs categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />
      </div>
      <MenuGrid
        items={visibleItems}
        onAdd={handleAdd}
        emptyMessage={debouncedSearch.trim() ? `No items match "${debouncedSearch.trim()}".` : undefined}
        hasMore={visibleCount < filteredItems.length}
        onLoadMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
      />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartLines}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
