# Swift Canteen — Component Architecture Rules
**Section 5 of 13 · v1.0**

---

## 0. Server-First

React Server Components are the default. A component becomes a Client
Component (`"use client"`) only when it needs one of: interactivity
(onClick, forms), browser-only APIs (localStorage, `useSyncExternalStore`),
or a React hook that requires the client runtime (`useState`, TanStack Query).

Push `"use client"` as low in the tree as possible — wrap the interactive
piece, not its server-rendered parent. This is why `OrdersNavLink.tsx` exists
as its own tiny client component instead of making `Navbar.tsx` a client
component: `Navbar` stays a Server Component and only the one interactive
piece pays the client-bundle cost.

---

## 1. Tiers

```
Tier 1 — src/components/ui/        Small shared primitives (buttons, inputs) — no domain logic
Tier 2 — src/components/layout/    Cross-page shell pieces (Navbar, Footer, PrefetchLink, CartBadge)
Tier 3 — src/app/**/_components/   or {Feature}Client.tsx colocated with a page — feature-specific UI
Tier 4 — src/app/**/page.tsx       Thin — fetch + compose, minimal JSX of its own
```

Dependency direction: Tier 4 → 3 → 2 → 1. A Tier 1 primitive never imports a
feature component.

---

## 2. The RSC Boundary — Functions Are Not Props

You cannot pass a function from a Server Component into a Client Component as
a prop — it isn't serializable across that boundary and Next.js throws at
render time. When a Client Component needs a function defined near a Server
Component ancestor (e.g. a prefetch callback), give the Client Component its
own small wrapper that imports the function directly:

```tsx
// Bad — Navbar (Server Component) passes a function prop
<PrefetchLink prefetchData={prefetchOrders} ... />   // crashes every page

// Good — OrdersNavLink.tsx, "use client", imports prefetchOrders itself
"use client";
import { prefetchOrders } from "@/lib/queries/orders";
export function OrdersNavLink() {
  return <PrefetchLink href="/orders" prefetchData={prefetchOrders} ...>My Orders</PrefetchLink>;
}
```

This bug has actually shipped once in this repo — treat it as a real failure
mode, not a hypothetical.

---

## 3. Page Files Stay Thin

```tsx
// Good
export default async function AdminMenuPage() {
  const { categories, items } = await getAdminMenuData();
  return <AdminMenuClient categories={categories} items={items} />;
}
```

Data fetching and composition only. Interactive rendering logic belongs in
the `Client.tsx` component the page renders.

---

## 4. Data Loading in Components

- **Server Component:** `await` the cache getter or service function directly — no loading state needed, Next.js suspends at the route/segment boundary.
- **Client Component needing fresh data post-mount:** use the matching hook in `src/lib/queries/` (TanStack Query) — handle `isLoading`/`error` explicitly, never a silent blank state.

```tsx
function OrderCard({ orderId }: { orderId: string }) {
  const { data, isLoading, error } = useOrder(orderId);
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState message={getErrorMessage(error)} />;
  ...
}
```

---

## 5. Props & Composition

- Prefer explicit props over sprawling context
- `className` merge via a small `cn()` helper if introduced — don't hand-concat conditional class strings past 2-3 conditions
- Named exports for feature components (matches existing convention — `AdminMenuClient`, `CheckoutClient`, `OrderDetailClient`)

---

## 6. Buttons vs Links — Use the Right Element

An action that navigates is a `<Link>`. An action that performs a mutation
(status change, delete, cancel) is a real `<button>` styled to look like a
button — not a link styled to look like a button and not a link that happens
to trigger a client-side handler. This matters for keyboard/screen-reader
semantics (Enter vs Space activation, no implicit GET navigation) and for
visual affordance — a destructive or state-changing action should look
pressable, not like the plain-text hyperlinks around it. See rule 07 §5 for
the actual visual treatment (elevation, hover/active/focus states) admin
action buttons should use.

---

## 7. Accessibility

- Interactive elements: visible focus ring (don't remove `outline` without a replacement)
- Icon-only buttons: `aria-label`
- Form fields: associated `<label>` (`htmlFor`) or `aria-labelledby`
- Respect `prefers-reduced-motion` for any custom animation
- Minimum touch target ~44px on mobile breakpoints (this is a mobile-first storefront — see rule 07)

---

## 8. Related

- `docs/rules/01-architecture.md` — the RSC/service/cache layering this tier structure sits on top of
- `docs/rules/07-responsiveness.md`
