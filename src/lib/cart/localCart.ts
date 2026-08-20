"use client";

// A localStorage-backed cart store, used as the source of truth for the
// customer's cart during a shopping session. Mutations are synchronous and
// local; the server is synced lazily in the background (see useLocalCart.ts)
// so that add/increment/decrement feel instant regardless of network latency.
//
// The storage key is scoped per signed-in user (falling back to a shared
// "guest" bucket when logged out). Without this, switching accounts on the
// same device/tab would show the previous account's cart contents — and,
// worse, mismatch what checkout actually sees, since the server-side order
// is built from the *new* account's server cart while the UI kept rendering
// the *old* account's local snapshot.

const STORAGE_KEY_PREFIX = "swift-canteen-cart-v1";
const GUEST_OWNER = "guest";

export interface LocalCartLine {
  itemId: string;
  quantity: number;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let snapshot: LocalCartLine[] = [];
let hydrated = false;
let currentOwner: string = GUEST_OWNER;

function storageKeyFor(owner: string): string {
  return `${STORAGE_KEY_PREFIX}:${owner}`;
}

function isLocalCartLine(value: unknown): value is LocalCartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return typeof line.itemId === "string" && typeof line.quantity === "number" && line.quantity > 0;
}

function readFromStorage(owner: string): LocalCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKeyFor(owner));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalCartLine);
  } catch {
    return [];
  }
}

function writeToStorage(lines: LocalCartLine[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKeyFor(currentOwner), JSON.stringify(lines));
  } catch {
    // storage unavailable/full — cart still works in-memory for this session
  }
}

function ensureHydrated() {
  if (hydrated) return;
  snapshot = readFromStorage(currentOwner);
  hydrated = true;
}

/**
 * Switches which account's cart bucket is active. Call this whenever the
 * signed-in identity changes (login, logout, account switch) — pass the
 * user id, or `null`/omit for the shared guest bucket. Re-reads storage
 * under the new key and drops any in-memory state left over from the
 * previous owner, so a UI still mounted across the switch can't keep
 * rendering (or worse, sync to the server) the wrong account's items.
 */
export function setLocalCartOwner(ownerId: string | null): void {
  const owner = ownerId ?? GUEST_OWNER;
  if (owner === currentOwner && hydrated) return;
  currentOwner = owner;
  snapshot = readFromStorage(owner);
  hydrated = true;
  for (const listener of listeners) listener();
}

function notify() {
  writeToStorage(snapshot);
  for (const listener of listeners) listener();
}

export function subscribeLocalCart(listener: Listener): () => void {
  ensureHydrated();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocalCartSnapshot(): LocalCartLine[] {
  ensureHydrated();
  return snapshot;
}

// Must be a stable reference — useSyncExternalStore re-invokes getServerSnapshot
// on every render, and a fresh [] each time trips React's "should be cached" warning.
const EMPTY_SNAPSHOT: LocalCartLine[] = [];

export function getLocalCartServerSnapshot(): LocalCartLine[] {
  return EMPTY_SNAPSHOT;
}

export function addLocalCartItem(itemId: string, quantity = 1): void {
  ensureHydrated();
  const existing = snapshot.find((line) => line.itemId === itemId);
  snapshot = existing
    ? snapshot.map((line) => (line.itemId === itemId ? { ...line, quantity: line.quantity + quantity } : line))
    : [...snapshot, { itemId, quantity }];
  notify();
}

export function setLocalCartItemQuantity(itemId: string, quantity: number): void {
  ensureHydrated();
  snapshot =
    quantity <= 0
      ? snapshot.filter((line) => line.itemId !== itemId)
      : snapshot.map((line) => (line.itemId === itemId ? { ...line, quantity } : line));
  notify();
}

export function removeLocalCartItem(itemId: string): void {
  setLocalCartItemQuantity(itemId, 0);
}

export function clearLocalCart(): void {
  snapshot = [];
  notify();
}

/** Overwrites the local cart wholesale — used to hydrate from the server cart. */
export function replaceLocalCart(lines: LocalCartLine[]): void {
  ensureHydrated();
  snapshot = lines.filter((line) => line.quantity > 0);
  notify();
}
