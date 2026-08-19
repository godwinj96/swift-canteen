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
  onAdd: (itemId: string) => Promise<void>;
}

export function MenuGrid({ items, onAdd }: MenuGridProps) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-stone-500">No items in this category yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <MenuItemCard key={item.id} {...item} onAdd={onAdd} />
      ))}
    </div>
  );
}
