# Swift Canteen — Architecture Rules
**Section 1 of 13 · Always Apply · v1.0**

---

## 0. Ground Truth

Swift Canteen is a single-tenant canteen ordering app: a customer storefront
(browse menu → cart → checkout → track order) plus a staff/admin console
(menu, orders, users, reports). There is no separate backend service — this
is a Next.js 15 App Router monolith that talks to Postgres (Supabase) via
Prisma directly.

**Stack:** Next.js 15 App Router + React 19 + TypeScript strict + Tailwind CSS 4
**Data:** Prisma ORM → Supabase Postgres (pooled connection, eu-west-1)
**Auth:** JWT in an httpOnly `session` cookie (`jose`), role gate in `src/middleware.ts`
**Payments:** Bachs hosted checkout — redirect + signed webhook, no card data on our servers
**Validation:** Zod schemas centralized in `src/lib/validation/schemas.ts`

---

## 1. The Layer Contract

Every feature follows this layering without exception.

```
LAYER 4 — PAGES (src/app/**/page.tsx)
  Server Components by default
  - Fetch data directly (await a cached getter or service function)
  - Render Client Component islands for anything interactive
  - Never call Prisma directly for anything beyond a simple, page-owned read —
    prefer a named getter in lib/cache or lib/{domain}/service.ts so the query
    is reusable and cacheable

LAYER 3 — ROUTE HANDLERS (src/app/api/**/route.ts)
  Thin HTTP adapters
  - Parse/validate the request with a Zod schema from lib/validation/schemas.ts
  - Call a service function — never inline Prisma queries here
  - Call revalidateTag(...) after a mutation succeeds (this is the ONLY place
    revalidateTag may be called — see rule 06 §2 for why)
  - Catch errors with toErrorResponse() (src/lib/errors.ts) — never let a raw
    error reach the client

LAYER 2 — SERVICES (src/lib/{domain}/service.ts)
  Business logic and transactions
  - Owns Prisma calls, transactions, state-machine transitions
  - Framework-agnostic: no next/server, no next/cache imports here (see rule 06)
  - Must be safely callable from tests with no live request context
  - Throws ApiError for expected failure states (not found, invalid transition,
    insufficient stock) — never returns ad-hoc { error } objects

LAYER 1 — CACHE (src/lib/cache/*.ts)
  Read-side caching wrapper around service/Prisma reads
  - unstable_cache(fn, keyParts, { revalidate, tags }) around expensive/frequent
    reads (admin dashboard, menu, orders lists)
  - Tags map 1:1 to the mutations that must invalidate them — see rule 06
```

### 1.1 Cross-Layer Prohibitions

| Prohibited | Reason |
|---|---|
| `prisma.*` calls inside a `page.tsx` or Client Component | Bypasses the service layer's validation/transaction guarantees |
| `fetch()` to your own API routes from a Server Component | Server Components can call the service/cache layer directly — an internal HTTP round trip is pure waste |
| `revalidateTag()` inside `lib/*/service.ts` | Throws `Invariant: static generation store missing` when the service is called from a test or a non-request context. Belongs in the route handler only. |
| Business logic in a route handler | Route handlers parse, delegate, revalidate, respond — nothing else |
| A function passed as a prop from a Server Component into a Client Component | Not serializable across the RSC boundary — wrap the client usage in its own small `"use client"` component that imports the function itself |
| Auth/role checks cached alongside data | Never cache an authentication check — see rule 06 §1 |

### 1.2 What Lives Where

| Concern | Location |
|---|---|
| Prisma client singleton | `src/lib/prisma.ts` |
| Cached read getters | `src/lib/cache/adminData.ts`, `src/lib/cache/publicData.ts` |
| Domain service (orders, cart, payments, auth) | `src/lib/{domain}/service.ts` |
| Zod schemas | `src/lib/validation/schemas.ts` |
| Error types | `src/lib/errors.ts` |
| Role/auth helpers | `src/lib/auth/*` |
| Client-side prefetch helpers | `src/lib/queries/*.ts` |
| Route pages (thin) | `src/app/**/page.tsx` |
| Client interaction islands | `src/components/**` (`"use client"` at the leaf, not the root) |

---

## 2. Server State vs Client State

See rule 03 for the full split. In short: **anything that would still be true
after the user refreshed the page is server state** — it lives in Prisma,
surfaced through the cache layer, never duplicated into client state. The one
deliberate exception is the shopping cart (rule 03 §2) — local-first by design,
synced to the server in the background.

---

## 3. Routing & Role Gating

Next.js App Router file-based routes under `src/app/`. Role gating is a single
choke point: `src/middleware.ts` reads the `session` cookie, verifies the JWT,
and checks `hasMinimumRole()` against the route prefix before the request ever
reaches a page or route handler.

| Prefix | Guard |
|---|---|
| `/admin/**` | STAFF or higher (page + `middleware.ts`) |
| `/api/dashboard/**`, `/api/admin/**`, `/api/users/**` | STAFF or higher (API) |
| `/checkout`, `/orders/**` | Any authenticated user |
| Everything else | Public |

Do not re-implement role checks inside individual pages/route handlers as the
primary guard — `middleware.ts` is the source of truth. A page-level check is
fine as defense-in-depth, never as the only check.

---

## 4. Feature-Add Checklist

1. Zod schema in `src/lib/validation/schemas.ts` if the feature takes input
2. Service function in `src/lib/{domain}/service.ts` — owns the Prisma call(s) and transaction
3. If it's a read that's expensive or hit often: wrap it in `unstable_cache` under `src/lib/cache/`, pick a tag
4. Route handler in `src/app/api/**/route.ts` — validate → call service → `revalidateTag(...)` on every tag that read touches → respond
5. Page/component consumes the cached getter (Server Component) or a `PrefetchLink`-style client hook (rule 06)
6. Loading/empty/error states
7. Tests: unit for pure logic, integration for the service function against a real transaction (rule 11)
8. `pnpm exec tsc --noEmit` and `pnpm exec eslint src` clean

---

## 5. Related

- `docs/rules/03-state-management.md` — server vs client state, cart architecture
- `docs/rules/04-api-layer.md` — Route Handler details
- `docs/rules/06-caching-and-performance.md` — cache tags, prefetching, the 1.5s FCP target
- `docs/rules/09-security.md` — auth, payments, secrets
- `CLAUDE.md` — GitNexus code-intelligence workflow (use it before editing any symbol)
