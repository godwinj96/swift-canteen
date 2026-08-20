"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatNaira } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CartItemData {
  id: string;
  quantity: number;
  item: { id: string; name: string; price: number };
}

export function ProcessingClient({ items }: { items: CartItemData[] }) {
  const searchParams = useSearchParams();
  const pickup = searchParams.get("pickup");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const total = items.reduce((sum, i) => sum + i.item.price * i.quantity, 0);

  useEffect(() => {
    // StrictMode/fast-refresh re-runs effects — guard against placing the
    // order twice from a single navigation.
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pickup ? { pickupTime: new Date(pickup).toISOString() } : {}),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error ?? "Could not place order");

        const paymentRes = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderData.order.id }),
        });
        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) throw new Error(paymentData.error ?? "Could not start payment");

        window.location.href = paymentData.checkoutUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Checkout failed");
      }
    })();
  }, [pickup]);

  return (
    <div className="mx-auto max-w-lg px-4 sm:px-8 py-16">
      <h1 className="font-display mb-8 text-4xl tracking-tight text-ink">
        {error ? "Something went wrong" : "Placing your order…"}
      </h1>
      <Card className="mb-8">
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
      </Card>
      {error ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/checkout">
            <Button className="w-full">Back to checkout</Button>
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-canteen border-t-transparent" />
          Setting up your order and redirecting you to payment…
        </div>
      )}
    </div>
  );
}
