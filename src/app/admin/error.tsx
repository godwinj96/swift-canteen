"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AdminErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start px-2 py-12">
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Dashboard error
      </span>
      <h1 className="font-display mt-2 text-3xl tracking-tight text-ink">
        This section failed to load
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Something went wrong loading this admin page. Try again below.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
