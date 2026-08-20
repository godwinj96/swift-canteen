"use client";

import { useEffect, useRef, useState } from "react";
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

// How long the "Added" confirmation shows before reverting to the normal
// label — long enough to register as a deliberate confirmation, short
// enough not to block a second add. This is pure visual feedback: the cart
// write it confirms already happened synchronously, before this state is
// even set (see onAdd below) — it never gates or delays the real mutation.
const CONFIRMATION_MS = 900;

export function MenuItemCard({ id, name, description, price, imageUrl, isAvailable, onAdd }: MenuItemCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const revertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (revertTimer.current) clearTimeout(revertTimer.current);
    };
  }, []);

  function handleClick() {
    // Local, synchronous, no network round trip — see lib/cart/useLocalCart.ts.
    // The confirmation below is purely visual polish on top of a write that
    // has already completed by the time this line runs.
    onAdd(id);
    setJustAdded(true);
    if (revertTimer.current) clearTimeout(revertTimer.current);
    revertTimer.current = setTimeout(() => setJustAdded(false), CONFIRMATION_MS);
  }

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
        onClick={handleClick}
        disabled={!isAvailable}
        className={`w-full rounded-full py-3 text-sm font-semibold text-white transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
          justAdded ? "bg-green-600" : "bg-ink hover:bg-canteen-dark"
        }`}
      >
        {!isAvailable ? "Unavailable" : justAdded ? "Added ✓" : "Add to cart"}
      </button>
    </div>
  );
}
