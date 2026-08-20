"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePushSubscription } from "@/lib/push/usePushSubscription";

interface EnableNotificationsPromptProps {
  /** "inline" for a compact banner CTA (order confirmation); "card" for the Account settings page. */
  variant?: "inline" | "card";
}

export function EnableNotificationsPrompt({ variant = "inline" }: EnableNotificationsPromptProps) {
  const { support, subscribe } = usePushSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (support === "unsupported" || support === "granted" || dismissed) {
    return variant === "card" && support === "granted" ? (
      <p className="text-sm text-muted">✓ Order notifications are on for this browser.</p>
    ) : null;
  }

  if (support === "denied") {
    return (
      <p className="text-sm text-muted">
        Notifications are blocked for this site in your browser settings — enable them there to get order updates.
      </p>
    );
  }

  async function handleEnable() {
    const ok = await subscribe();
    if (ok) {
      toast.success("Order notifications are on.");
    } else {
      toast.error("Couldn't enable notifications.");
    }
  }

  if (variant === "card") {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          Get notified when your order is accepted, being prepared, and ready for pickup.
        </p>
        <button
          onClick={handleEnable}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-canteen-dark"
        >
          Enable
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-3 text-sm">
      <button onClick={handleEnable} className="font-semibold text-emerald-800 underline hover:no-underline">
        Get notified about order updates
      </button>
      <button onClick={() => setDismissed(true)} className="text-emerald-700/70 hover:text-emerald-800">
        Not now
      </button>
    </div>
  );
}
