"use client";

import { MenuItemCard } from "./MenuItemCard";

interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
}

interface MenuGridProps {
  items: MenuItemData[];
  quantities: Map<string, number>;
  onAdd: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  emptyMessage?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function MenuGrid({ items, quantities, onAdd, onUpdateQuantity, emptyMessage, hasMore, onLoadMore }: MenuGridProps) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-stone-500">{emptyMessage ?? "No items in this category yet."}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            {...item}
            quantity={quantities.get(item.id) ?? 0}
            onAdd={onAdd}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>
      {hasMore && onLoadMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoadMore}
            className="rounded-full border border-line px-7 py-3 text-sm font-semibold text-ink hover:bg-canteen-light"
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}
