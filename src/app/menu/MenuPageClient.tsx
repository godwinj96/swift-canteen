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

  const cartQuantities = useMemo(
    () => new Map(cart.lines.map((line) => [line.itemId, line.quantity])),
    [cart.lines]
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
      </div>
      <div className="mb-6">
        <SearchInput value={searchInput} onChange={setSearchInput} />
      </div>
      <div className="mb-8">
        <CategoryTabs categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />
      </div>
      <MenuGrid
        items={visibleItems}
        quantities={cartQuantities}
        onAdd={handleAdd}
        onUpdateQuantity={handleUpdateQuantity}
        emptyMessage={debouncedSearch.trim() ? `No items match "${debouncedSearch.trim()}".` : undefined}
        hasMore={visibleCount < filteredItems.length}
        onLoadMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
      />
      {cart.count > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          aria-label={`Open cart, ${cart.count} items`}
          className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-canteen text-white shadow-elevation-lg transition-transform hover:bg-canteen-dark active:scale-95"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 4h2l1.4 12.6a2 2 0 0 0 2 1.8h7.4a2 2 0 0 0 2-1.7L19 8H6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-bold text-white">
            {cart.count}
          </span>
        </button>
      )}
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
