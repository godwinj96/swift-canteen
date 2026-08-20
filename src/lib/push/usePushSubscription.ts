"use client";

import { useCallback, useSyncExternalStore } from "react";

export type PushSupport = "unsupported" | "unknown" | "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64Safe);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i);
  return bytes;
}

function isSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

// Notification.permission has no native change event, so subscribe() below
// notifies this tiny listener set itself after requestPermission() resolves
// — the useSyncExternalStore pattern this codebase already uses for browser
// APIs without React bindings (see the online/offline example in the react
// hooks rules), which avoids both a setState-in-effect cascading render and
// an SSR/client hydration mismatch (getServerSnapshot stays a stable
// "unknown" since window/Notification don't exist during SSR).
const permissionListeners = new Set<() => void>();

function subscribeToPermission(callback: () => void): () => void {
  permissionListeners.add(callback);
  return () => permissionListeners.delete(callback);
}

function getPermissionSnapshot(): PushSupport {
  if (!isSupported()) return "unsupported";
  return Notification.permission as PushSupport;
}

function getServerPermissionSnapshot(): PushSupport {
  return "unknown";
}

/**
 * Feature-detects Web Push support and exposes a single subscribe() call
 * that registers the service worker, requests permission, subscribes, and
 * POSTs the subscription to the server. Fails gracefully everywhere —
 * unsupported browsers, denied permission, missing VAPID config server-side
 * — this is a pure enhancement on top of the existing polling-based order
 * status UI, never something the rest of the app depends on.
 */
export function usePushSubscription() {
  const support = useSyncExternalStore(subscribeToPermission, getPermissionSnapshot, getServerPermissionSnapshot);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) return false;

    try {
      const permission = await Notification.requestPermission();
      for (const listener of permissionListeners) listener();
      if (permission !== "granted") return false;

      const keyRes = await fetch("/api/push/vapid-public-key");
      if (!keyRes.ok) return false;
      const { publicKey } = (await keyRes.json()) as { publicKey: string };

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { support, subscribe };
}
