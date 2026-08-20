# Swift Canteen — Caching & Performance Rules
**Section 6 of 13 · v1.0**

---

## 0. The Target

**First contentful paint on a click-through should feel instant — target ≈1.5s
worst case, near-0ms perceived for anything prefetchable.** The whole point of
caching + prefetching is that the first time a user clicks a link is not the
first time the underlying data fetch happens. If a click still triggers a
cold, synchronous DB round trip to Supabase (eu-west-1, real network RTT),
that's a caching/prefetching gap, not something to shrug off as "just Next.js
dev mode is slow."

This app previously had **zero server-side caching** — every tab switch and
menu load re-ran a fresh Prisma query. That was the root cause of the
"diabolically sluggish" admin experience reported in this project's history.
The fix below is deliberate and must be applied to every new data-heavy
surface, not just the ones that happened to get audited first.

---

## 1. Server-Side Cache: `unstable_cache`

Every read that's either expensive (joins, aggregates) or hit on every
navigation (menu, admin tabs, order lists) is wrapped:

```typescript
export const getAdminMenuData = unstable_cache(
  async () => { /* categories + menuItems, mapped */ },
  ["admin-menu-data"],
  { revalidate: 20, tags: ["admin-menu"] }
);
```

**Never cache an authentication or authorization check.** The user's
role/session must always be read fresh — only the *data* behind the gate is
cacheable, and the gate itself (`middleware.ts`, `requireRole()`) runs every
request regardless of cache state.

**Bound every list query.** An unbounded `findMany` is both a caching problem
and a correctness problem — pick a sane `take` (e.g. 200 for admin order
lists) even on a cached read, so the cache doesn't just make an unbounded
query fast instead of fixing it.

---

## 2. Tag-Based Invalidation — the Non-Negotiable Pairing

Every `unstable_cache` read has a tag. Every mutation that changes the
underlying data calls `revalidateTag()` for every tag it affects, **from the
route handler, immediately after the service call returns** — never from
inside the service layer itself.

**Why not in the service layer:** `revalidateTag()` requires a live Next.js
request/static-generation-store context. Calling it from a shared service
function breaks the moment that function is invoked outside a real request —
which includes every integration test that calls the service directly. This
already broke 8 tests in this project once; the fix was moving every
`revalidateTag` call out to the calling route handler. Don't reintroduce it
inside a service function.

| Mutation | Tags to revalidate |
|---|---|
| Create/update/delete menu item, toggle availability | `admin-menu`, `public-menu` |
| Create category | `admin-menu`, `public-menu` |
| Update user role | `admin-users` |
| Place order | `orders`, `admin-orders`, `admin-dashboard` |
| Update order status | `orders`, `admin-orders`, `admin-dashboard`, `admin-reports` |
| Payment webhook reconciliation | `orders`, `admin-orders`, `admin-dashboard`, `admin-reports` |

A mutation that forgets a tag leaves stale data visible until the cache's
`revalidate` window expires (10-20s in this app) — that's a real bug, not a
harmless staleness window, because it means an admin's own action doesn't
show up on their own next click.

---

## 3. Client-Side Prefetching

Prefetching means the data fetch starts on **hover/focus intent**, before the
click — so by the time the click lands and the new page mounts, the data is
already resolved or resolving. This is the industry-standard pattern (Next.js
`<Link prefetch>` does this for the route JS/RSC payload; this app additionally
prefetches the underlying *data* via TanStack Query for surfaces where the
page needs client-fetched data after mount).

Pattern: `PrefetchLink` (`src/components/layout/PrefetchLink.tsx`) fires
`queryClient.prefetchQuery(...)` — using a helper from `src/lib/queries/` —
`onMouseEnter`/`onFocus`, in addition to Next's own route prefetch.

```tsx
<PrefetchLink href="/orders" prefetchData={prefetchOrders} className="...">
  My Orders
</PrefetchLink>
```

**Apply this to every primary navigation surface** — navbar links, admin
sidebar tabs, order-list-to-detail links, category tabs on the menu page —
not just the one link that happened to get built first. A link with no
`prefetch` and no cached read behind its destination page is exactly the kind
of gap that produces a "first click is slow" complaint even after the server
cache is in place, because the *first* visitor to hit a cold cache entry still
pays the full query cost — prefetching is what hides that cost behind
hover/focus dwell time instead of the click itself.

**Do not confuse this with the cart.** The cart's speed comes from being
local-first (rule 03 §3), not from prefetching — there's no server round trip
to hide in the first place for an add-to-cart click.

---

## 4. What NOT to Do

- Don't gate a simple client-side "move to next step" navigation (e.g. cart →
  order-summary) behind an API call unless that call does real, necessary
  work (validating with an external payment provider, etc.). If a button
  labeled "Checkout" isn't calling Bachs yet, it shouldn't be awaiting a
  network round trip before navigating — move the user to the page where the
  real server-side work happens, and do that work there.
- Don't add a cache layer without a corresponding invalidation tag — an
  uninvalidated cache is worse than no cache, because it silently serves
  wrong data instead of just being slow.
- Don't cache per-user data (a specific user's cart, session) under a shared
  key — every cache key must be scoped correctly or one user will see
  another's data.

---

## 5. Verification

- Measure, don't assume: time a cold vs. warm navigation for any surface you
  touch. This project's caching fix was verified by measuring ~7-11s → ~0.7-2.2s
  on repeat admin tab visits — a real before/after number, not a guess.
- After adding/changing a cache tag, manually trigger the mutation and
  confirm the dependent read reflects it on the very next request (not just
  eventually, after the TTL) — this is what actually proves invalidation
  wiring is correct.

---

## 6. Related

- `docs/rules/01-architecture.md` — where `unstable_cache` and `revalidateTag` are allowed to live
- `docs/rules/03-state-management.md` — server vs client state split
- `docs/rules/05-component-architecture.md` — the RSC-boundary bug that broke prefetching once already
