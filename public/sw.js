// Plain static service worker (no bundler) — just enough to receive Web Push
// events and show a notification. Registered from usePushSubscription.ts.

self.addEventListener("push", (event) => {
  let payload = { title: "Swift Canteen", body: "You have an order update.", url: "/dashboard" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Non-JSON push payload — fall back to the defaults above.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon",
      badge: "/icon",
      data: { url: payload.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.endsWith(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
