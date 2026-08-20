"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import {
  addLocalCartItem,
  getLocalCartServerSnapshot,
  getLocalCartSnapshot,
  removeLocalCartItem,
  replaceLocalCart,
  setLocalCartItemQuantity,
  setLocalCartOwner,
  subscribeLocalCart,
  type LocalCartLine,
} from "./localCart";

/** Lightweight subscription for anywhere that only needs the item count (e.g. a navbar badge). */
export function useLocalCartCount(): number {
  const lines = useSyncExternalStore(subscribeLocalCart, getLocalCartSnapshot, getLocalCartServerSnapshot);
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

const SYNC_DEBOUNCE_MS = 900;

/**
 * Local-first cart: reads/writes happen synchronously against localStorage
 * (instant, no network wait), and the server's Cart/CartItem rows are synced
 * in the background via a debounced PUT /api/cart, so checkout and any
 * server-side/admin views stay eventually consistent without the round trip
 * ever blocking an add/increment/decrement interaction.
 */
export function useLocalCart(userId: string | null) {
  const isLoggedIn = userId !== null;
  const lines = useSyncExternalStore(subscribeLocalCart, getLocalCartSnapshot, getLocalCartServerSnapshot);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks which owner we've already run server hydration for, so switching
  // accounts (a new userId) re-triggers hydration instead of silently
  // reusing the previous account's "already hydrated" flag.
  const hydratedForOwner = useRef<string | null>(null);

  // Re-scope the local cart to the current account the moment identity is
  // known/changes — before anything else reads or writes the store, so no
  // component can observe (or sync to the server) a stale account's items.
  useEffect(() => {
    setLocalCartOwner(userId);
  }, [userId]);

  // One-time-per-owner hydration from the server cart, only when the local
  // cart is empty (e.g. first visit on this device) — an already-populated
  // local cart is treated as authoritative and will overwrite the server on sync.
  useEffect(() => {
    if (!isLoggedIn || hydratedForOwner.current === userId) return;
    hydratedForOwner.current = userId;
    if (getLocalCartSnapshot().length > 0) return;

    fetch("/api/cart")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { cart?: { items?: { itemId: string; quantity: number }[] } } | null) => {
        const items = data?.cart?.items;
        if (!items?.length) return;
        replaceLocalCart(items.map((i) => ({ itemId: i.itemId, quantity: i.quantity })));
      })
      .catch(() => {
        // background hydration — safe to ignore, local cart just stays empty
      });
  }, [isLoggedIn, userId]);

  const syncNow = useCallback(async (linesToSync: LocalCartLine[]) => {
    if (syncTimer.current) {
      clearTimeout(syncTimer.current);
      syncTimer.current = null;
    }
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: linesToSync }),
    });
  }, []);

  // Debounced background sync on every local change.
  useEffect(() => {
    if (!isLoggedIn) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      void fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines }),
      });
    }, SYNC_DEBOUNCE_MS);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [lines, isLoggedIn]);

  /** Forces an immediate sync — call before checkout so the server-side order is built from current data. */
  const forceSyncNow = useCallback(() => syncNow(getLocalCartSnapshot()), [syncNow]);

  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    addItem: addLocalCartItem,
    updateQuantity: setLocalCartItemQuantity,
    removeItem: removeLocalCartItem,
    forceSyncNow,
  };
}
