# Port Matrix — gradpreneur-web → swift-canteen

**Source:** `../gradpreneur-web/docs/rules/` (Vite SPA + TanStack Router + Go backend, multi-role)
**Target:** `swift-canteen` (Next.js 15 App Router monolith, Prisma direct-to-DB, single storefront + admin)
**Ported:** 2026-08-20

Swift Canteen has no separate backend service — Route Handlers under `src/app/api/*`
call service functions in `src/lib/*/service.ts` which talk to Prisma directly. There
is no swagger contract, no client/server type-sync step, no WebSocket layer, no
Zustand, no Stripe Elements (payment happens via a Bachs-hosted checkout redirect +
webhook), and no multi-role SPA shell. The port below keeps the *principles*
(layering, cache-key discipline, validate-at-the-boundary, fail-closed security) and
rewrites every concrete detail to match what's actually in this repo.

| Source file | Target file | Action |
|---|---|---|
| `01-architecture.md` | `01-architecture.md` | Rewritten — RSC/Route-Handler/service/Prisma layers replace the fetch-client/hook/component split |
| `02-folder-structure.md` | `02-folder-structure.md` | Rewritten to match actual `src/app`, `src/lib`, `src/components` tree |
| `03-state-management.md` | `03-state-management.md` | Rewritten — server state is Prisma + `unstable_cache`, not TanStack Query (TanStack Query here is prefetch-only, see rule 06); client state is the local-first cart, not Zustand |
| `04-api-layer.md` | `04-api-layer.md` | Rewritten around Route Handlers + Zod + the service layer; no wire/app DTO split (Prisma models are the types) |
| `05-ai-response-handling.md` | — | **Excluded** — no AI features in this app |
| `06-component-architecture.md` | `05-component-architecture.md` | Rewritten — Server Components by default, `"use client"` only at interaction boundaries; no shadcn tiering, no TanStack Router route tiers |
| `07-navigation.md` | folded into `01-architecture.md` §4 | App Router file-based routing + `middleware.ts` role guard is simple enough not to need its own file |
| `08-responsiveness.md` | `07-responsiveness.md` | Adapted — mobile-first storefront (opposite of the source's desktop-first dashboard), Tailwind 4 tokens |
| `09-performance.md` | `06-caching-and-performance.md` | Rewritten and expanded — this is the file backing the "1.5s FCP, aggressive prefetch" work; merges the source's performance rule with its own cache/prefetch content since this app's bottleneck is server-side DB latency, not client bundle size |
| `10-input-validation.md` | `08-input-validation.md` | Adapted — Zod schemas already centralized in `src/lib/validation/schemas.ts`; no react-hook-form in this app yet, so patterns cover both plain controlled forms and future RHF adoption |
| `11-realtime-websockets.md` | — | **Excluded** — no WebSocket/realtime features |
| `12-security.md` | `09-security.md` | Adapted — JWT cookie session (not localStorage bearer tokens), Bachs webhook HMAC verification, env-var secret discipline |
| `13-error-handling-monitoring.md` | `10-error-handling.md` | Adapted around the existing `ApiError`/`toErrorResponse` pattern in `src/lib/errors.ts` |
| `14-testing.md` | `11-testing.md` | Adapted — Vitest + `node-mocks-http` integration tests already established under `tests/` |
| `15-dx-tooling.md` | `12-dx-tooling.md` | Adapted — pnpm scripts, `@/` alias, no type-sync step (Prisma generates types directly) |
| `16-monetization.md` | folded into `09-security.md` §5 | Payment surface here is one Bachs integration, not a full billing system — doesn't warrant a standalone file |
| `17-product-strategy.md` | — | **Excluded for now** — no multi-role product strategy to encode yet; revisit if the product scope grows beyond a single canteen storefront + admin |
| `18-agents-md.md` | `13-claude-md-protocol.md` | Adapted — `CLAUDE.md` is this repo's entry index (already exists, GitNexus-generated header preserved), no `.cursor/rules/` sync step since this repo doesn't use Cursor rule files |

## Explicit exclusions (source-specific, don't apply here)

- TanStack Router, `routeTree.gen.ts`, `beforeLoad` guards — this app uses Next.js App
  Router + `middleware.ts` for role gating.
- Zustand — never introduced here; client state is component state + the local-first
  cart (`useSyncExternalStore` + localStorage).
- Swagger-driven type sync (`types:sync`) — Prisma's generated client is the single
  source of truth for types; no wire/app DTO split.
- WebSocket AI chat / collab chat — not part of this app.
- Stripe Elements / PaymentIntents — Bachs payment is a hosted-checkout redirect +
  webhook, not embedded card fields.
- Multi-role SPA shell (`graduate/mentor/investor/admin`) — this app has exactly two
  surfaces: the customer storefront and `/admin` (staff/admin role-gated).
