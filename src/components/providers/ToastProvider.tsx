"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "!rounded-2xl !border !border-line !bg-white !text-ink !shadow-lg",
          title: "!font-medium",
          error: "!border-red-200",
          success: "!border-green-200",
        },
      }}
    />
  );
}
