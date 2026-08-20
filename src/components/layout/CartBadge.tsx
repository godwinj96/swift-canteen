"use client";

import Link from "next/link";
import { useLocalCartCount } from "@/lib/cart/useLocalCart";

export function CartBadge() {
  const count = useLocalCartCount();

  return (
    <Link href="/menu" className="relative text-muted hover:text-canteen" aria-label={`Cart, ${count} items`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 4h2l1.4 12.6a2 2 0 0 0 2 1.8h7.4a2 2 0 0 0 2-1.7L19 8H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-canteen px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
