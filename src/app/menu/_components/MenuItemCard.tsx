"use client";

import Image from "next/image";
import { formatNaira } from "@/lib/currency";

interface MenuItemCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  onAdd: (itemId: string) => void;
}

export function MenuItemCard({ id, name, description, price, imageUrl, isAvailable, onAdd }: MenuItemCardProps) {
  return (
    <div className="shadow-elevation-sm hover:shadow-elevation-md flex flex-col gap-3.5 rounded-2xl bg-canteen-light p-4 transition-shadow">
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
        onClick={() => onAdd(id)}
        disabled={!isAvailable}
        className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white transition-all hover:bg-canteen-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAvailable ? "Add to cart" : "Unavailable"}
      </button>
    </div>
  );
}
