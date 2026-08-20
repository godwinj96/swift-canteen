# Swift Canteen — State Management Rules
**Section 3 of 13 · v1.0**

---

## 0. The Golden Rule

**Server state → Prisma, surfaced via the cache layer. Client state → component
state or the local-first cart.** There is no global client store (no Zustand,
no Redux) — don't introduce one without a real, documented reason.

**Boundary test:** if the user refreshed the page, should this value come from
the database? Yes → server state. No → client state.

**Two cache layers, not one instead of the other:** `unstable_cache` (rule 06)
and TanStack Query are not redundant — they cache different things, at
different points in the request lifecycle, for different reasons:

| | `unstable_cache` | TanStack Query |
|---|---|---|
| Runs where | Server (Route Handlers / Server Components) | Browser |
| Caches | The result of a Prisma/DB read | The result of a `fetch()` to our own API |
| Answers | "Does the server need to hit Postgres again?" | "Does the browser need to re-request the API, and how does the UI show loading/error/mutation state while it does?" |
| Invalidated by | `revalidateTag()` from a route handler | `queryClient.invalidateQueries()` / `setQueryData()` from a mutation's `onSuccess` |

A typical admin page uses **both**, in sequence: the Server Component calls a
cached getter (e.g. `getAdminOrdersData()`) so the *first* HTML response is
fast without hitting Postgres cold — then the Client Component hydrates with
that as `initialData` and uses a TanStack Query hook (`useAdminOrders()`) so
that in-browser mutations (advance status, cancel) can update the UI, show
`isPending`, and refetch/patch the cache without a full page reload. Removing
either layer breaks something real: drop `unstable_cache` and every admin tab
switch goes back to a cold Prisma query; drop TanStack Query and every admin
mutation has to hand-roll its own loading state and manual refetch.

---

## 1. Server State

Server state is read through `src/lib/cache/adminData.ts` /
`src/lib/cache/publicData.ts` (both `unstable_cache`-wrapped) or, for
per-request/per-user reads that shouldn't be cached (auth, cart contents),
directly through the relevant `lib/{domain}/service.ts` function.

| Data | Getter | Cache tag | Revalidate |
|---|---|---|---|
| Admin dashboard stats | `getAdminDashboardStats` | `admin-dashboard` | 20s |
| Admin menu | `getAdminMenuData` | `admin-menu` | 20s |
| Admin orders | `getAdminOrdersData` | `admin-orders` | 20s |
| Admin users | `getAdminUsersData` | `admin-users` | 20s |
| Admin reports | `getAdminReportsData` | `admin-reports` | 20s |
| Public menu (`/menu`) | `getPublicMenuData` | `public-menu` | 20s |
| Customer order list/detail | `getCachedOrdersForUser` / `getCachedOrderById` | `orders` | 10s |

See rule 06 for the full tag→mutation invalidation map and why revalidation
lives in route handlers only, never in the service layer.

**Never cache an auth check.** Session/role reads always run fresh.

---

## 2. Client State

| Concern | Where |
|---|---|
| Cart contents (add/increment/decrement) | Local-first store: `useSyncExternalStore` + localStorage, keyed per-account (rule 03 §3) — instant, zero network round trip per interaction |
| Modal/dialog open state | Component `useState` |
| Form drafts | Component state / uncontrolled inputs |
| Theme, UI toggles | Component state or a small client provider under `src/components/providers/` |
| Admin data + mutations (orders, menu, users, reports) after the initial server render | TanStack Query — `src/lib/queries/*.ts` hooks, seeded with `initialData` from the Server Component, handle refetch/`isPending`/cache patching for every admin mutation |
| Order detail polling while a payment is pending | TanStack Query, `refetchInterval` in `useOrderDetail` |
| Client-side prefetch (hover-triggered) | The same TanStack Query cache, warmed early via `PrefetchLink`/`RolePrefetcher` (rule 06 §3) — prefetching is a *usage* of the query cache, not a separate cache |

Do not mirror server data (orders, menu items, users) into a second `useState`
copy "just to have it locally" when a TanStack Query hook for that data
already exists — read/mutate through the hook so cache invalidation, loading
state, and prefetching all stay coherent.

---

## 3. Cart — Local-First Architecture

The cart is the one part of this app that is deliberately client-owned:

- **Source of truth during a session:** localStorage, read/written through a
  `useSyncExternalStore` hook so all components see the same state synchronously.
- **Per-account isolation:** the localStorage key MUST be scoped by the signed-in
  user's id (or an explicit "guest" bucket when logged out) — never a single
  global key. Switching accounts on the same device must not leak the previous
  account's cart into the new session, and must not silently show stale items
  that don't exist in the new account's server-side cart. On logout/login, the
  store re-reads under the new key; it does not carry the old key's contents
  forward.
- **Background sync:** local cart changes are pushed to the server
  (`/api/cart`) debounced, not on every click — the UI never blocks on this.
- **Reconciliation:** on checkout, the server cart (not raw client state) is
  the input to order creation — availability and price are re-validated
  server-side regardless of what the client believes.
- **Never trust client-only cart state for the final order total or item
  availability** — always re-check server-side at checkout.

---

## 4. Prohibitions

- `useState` + a `useEffect` fetch for data `unstable_cache` or a Server
  Component could have fetched directly
- Duplicating server data into a client provider "for convenience"
- A second, uncoordinated copy of cache/query logic for the same data (this
  has happened once already — `admin/reports/page.tsx` had its own inline
  copy of the reports query alongside the cached getter; if you find a
  duplicate, delete it and point at the shared getter)
- Introducing Zustand/Redux without logging the decision (rule 13)

---

## 5. Related

- `docs/rules/01-architecture.md` — layer contract
- `docs/rules/06-caching-and-performance.md` — cache tags, invalidation, prefetch
