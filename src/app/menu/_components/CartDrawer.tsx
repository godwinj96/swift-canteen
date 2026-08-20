"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/currency";
import { QuantityStepper } from "@/components/ui/QuantityStepper";

interface CartItemData {
  itemId: string;
  quantity: number;
  item: { id: string; name: string; price: number };
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItemData[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onCheckout: () => Promise<void>;
}

export function CartDrawer({ open, onClose, items, onUpdateQuantity, onRemove, onCheckout }: CartDrawerProps) {
  const [checkingOut, setCheckingOut] = useState(false);
  const total = items.reduce((sum, i) => sum + i.item.price * i.quantity, 0);

  async function handleCheckoutClick() {
    setCheckingOut(true);
    try {
      await onCheckout();
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink/40" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line p-6">
          <h2 className="font-display text-2xl text-ink">Your cart</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close cart">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <p className="text-sm text-muted">Your cart is empty.</p>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map((cartItem) => (
                <li key={cartItem.itemId} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">{cartItem.item.name}</p>
                    <p className="text-xs text-muted">{formatNaira(cartItem.item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <QuantityStepper
                      quantity={cartItem.quantity}
                      onChange={(quantity) => onUpdateQuantity(cartItem.itemId, quantity)}
                      size="sm"
                    />
                    <button
                      onClick={() => onRemove(cartItem.itemId)}
                      className="ml-1 text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-line p-6">
          <div className="mb-4 flex items-center justify-between font-semibold text-ink">
            <span>Total</span>
            <span>{formatNaira(total)}</span>
          </div>
          <button
            disabled={items.length === 0 || checkingOut}
            onClick={handleCheckoutClick}
            className="w-full rounded-full bg-canteen py-3.5 font-semibold text-white hover:bg-canteen-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkingOut ? "Preparing checkout..." : "Checkout"}
          </button>
        </div>
      </div>
    </>
  );
}
