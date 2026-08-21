"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocalCartCount } from "@/lib/cart/useLocalCart";
import { setLocalCartOwner } from "@/lib/cart/localCart";

// CartBadge renders on every page via Navbar, but the local cart's owner
// scope (see localCart.ts) is a module-level singleton — until now, only
// useLocalCart (mounted on /menu) ever called setLocalCartOwner. A user who
// logs in and lands anywhere other than /menu first (or navigates there via
// client-side routing, which keeps this module's state alive across the
// navigation) would see the previous owner's cart bucket — stale items from
// a prior account, or a guest cart bleeding into a fresh login — until /menu
// happened to mount. Scoping it here too closes that gap: the badge is the
// one cart-reading surface guaranteed to mount on every authenticated page.
const CartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 4h2l1.4 12.6a2 2 0 0 0 2 1.8h7.4a2 2 0 0 0 2-1.7L19 8H6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

interface CartBadgeProps {
  userId: string;
  /** "icon" fits inline among the desktop nav's horizontal icon/text row.
   * "row" renders a full-width labelled row instead, matching the height and
   * typography of the other stacked links in the mobile drawer — an
   * icon-only badge left floating in that vertical list has no label and
   * reads as misplaced next to full-width text rows. */
  variant?: "icon" | "row";
}

export function CartBadge({ userId, variant = "icon" }: CartBadgeProps) {
  useEffect(() => {
    setLocalCartOwner(userId);
  }, [userId]);

  const count = useLocalCartCount();

  if (variant === "row") {
    return (
      <Link href="/menu" className="flex items-center justify-between text-muted hover:text-canteen">
        <span className="flex items-center gap-3">
          <CartIcon />
          Cart
        </span>
        {count > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-canteen px-1.5 text-[11px] font-bold text-white">
            {count}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link href="/menu" className="relative text-muted hover:text-canteen" aria-label={`Cart, ${count} items`}>
      <CartIcon />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-canteen px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
