"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 sm:px-8 py-24 text-center">
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Something broke
      </span>
      <h1 className="font-display mt-3 text-4xl tracking-tight text-ink">
        We hit a snag
      </h1>
      <p className="mt-3 text-muted">
        An unexpected error occurred while loading this page. You can try again, or head back home.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="ghost">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
