"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatNaira } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CartItemData {
  id: string;
  quantity: number;
  item: { id: string; name: string; price: number };
}

function CancelledPaymentBanner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  if (searchParams.get("payment") !== "cancelled" || !orderId) return null;

  return (
    <Card className="mb-8 border border-canteen/30 bg-canteen-light">
      <p className="text-sm text-ink">
        Your payment was cancelled — your order is still waiting.{" "}
        <Link href={`/orders/${orderId}`} className="font-semibold text-canteen-dark hover:underline">
          Resume payment for that order →
        </Link>
      </p>
    </Card>
  );
}

export function CheckoutClient({ items }: { items: CartItemData[] }) {
  const router = useRouter();
  const [pickupTime, setPickupTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, i) => sum + i.item.price * i.quantity, 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Nothing here calls Bachs or even creates the order yet — this is a
    // plain client-side route change, so the click responds instantly. The
    // order-creation and payment-initiation calls (the actual DB/network
    // work) happen on /checkout/processing, a page whose whole purpose is
    // "this is in progress," instead of behind an unresponsive button.
    const qs = pickupTime ? `?pickup=${encodeURIComponent(pickupTime)}` : "";
    router.push(`/checkout/processing${qs}`);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 sm:px-8 py-24 text-center">
        <Suspense fallback={null}>
          <CancelledPaymentBanner />
        </Suspense>
        <p className="text-muted">Your cart is empty.</p>
        <button
          onClick={() => router.push("/menu")}
          className="mt-6 rounded-full bg-canteen px-7 py-3.5 font-semibold text-white hover:bg-canteen-dark"
        >
          Browse the menu
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-8 py-16">
      <Suspense fallback={null}>
        <CancelledPaymentBanner />
      </Suspense>
      <h1 className="font-display mb-8 text-4xl tracking-tight text-ink">Checkout</h1>
      <div className="mb-8 rounded-2xl bg-canteen-light p-6">
        <ul className="flex flex-col gap-3 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between text-ink">
              <span>
                {i.quantity}× {i.item.name}
              </span>
              <span>{formatNaira(i.item.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-semibold text-ink">
          <span>Total</span>
          <span>{formatNaira(total)}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink">
            Preferred pickup time (optional)
          </label>
          <input
            type="datetime-local"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            className="w-full rounded-xl border border-line px-4 py-3 text-sm focus:border-canteen focus:outline-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Redirecting to payment..." : "Pay now"}
        </Button>
      </form>
    </div>
  );
}
