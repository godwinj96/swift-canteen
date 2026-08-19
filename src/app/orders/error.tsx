"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function OrdersErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 sm:px-8 py-24 text-center">
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Orders error
      </span>
      <h1 className="font-display mt-3 text-3xl tracking-tight text-ink">
        Couldn&apos;t load your orders
      </h1>
      <p className="mt-3 text-muted">Something went wrong. Try again below.</p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
