"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-4 sm:px-8 text-center antialiased">
        <span className="text-[13px] font-semibold tracking-[0.08em] text-orange-600 uppercase">
          Application error
        </span>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900">
          Something went badly wrong
        </h1>
        <p className="mt-3 max-w-md text-stone-600">
          The app crashed unexpectedly. Reloading usually fixes this.
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Reload
        </button>
      </body>
    </html>
  );
}
