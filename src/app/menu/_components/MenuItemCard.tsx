"use client";

import { useState } from "react";
import Image from "next/image";
import { formatNaira } from "@/lib/currency";

interface MenuItemCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  onAdd: (itemId: string) => Promise<void>;
}

export function MenuItemCard({ id, name, description, price, imageUrl, isAvailable, onAdd }: MenuItemCardProps) {
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAdding(true);
    try {
      await onAdd(id);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl bg-canteen-light p-4">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={400}
          height={180}
          className="h-[180px] w-full rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-[180px] w-full items-center justify-center rounded-xl bg-[#FDE9D4]">
          <span className="text-3xl">🍽️</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <h3 className="font-semibold text-ink">{name}</h3>
          {description && <p className="text-sm leading-snug text-muted">{description}</p>}
        </div>
        <span className="shrink-0 font-bold text-canteen-dark">{formatNaira(price)}</span>
      </div>
      <button
        onClick={handleAdd}
        disabled={!isAvailable || adding}
        className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white transition-colors hover:bg-canteen-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!isAvailable ? "Unavailable" : adding ? "Adding..." : "Add to cart"}
      </button>
    </div>
  );
}
