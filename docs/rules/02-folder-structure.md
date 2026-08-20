# Swift Canteen — Folder Structure Rules
**Section 2 of 13 · v1.0**

---

## 0. Guiding Principles

1. **Feature proximity** — code that changes together lives together
2. **Layer separation** — `app/api`, `lib/{domain}/service.ts`, `lib/cache` stay separate (rule 01)
3. **`@/` alias** maps to `src/` (see `tsconfig.json` paths) — no deep relative imports
4. **Server Component by default** — a file only gets `"use client"` when it needs interactivity, and that boundary should sit as low in the tree as possible

---

## 1. Top-Level Tree

```
swift-canteen/
├── src/
│   ├── app/
│   │   ├── admin/{menu,orders,reports,users}/     Staff/admin pages
│   │   ├── api/{domain}/route.ts                  Route Handlers
│   │   ├── account/, checkout/, orders/[id]/       Customer pages
│   │   ├── login/, register/, forgot-password/,
│   │   │   reset-password/                         Auth pages
│   │   ├── menu/_components/                       Storefront menu UI
│   │   ├── privacy/, terms/                         Static pages
│   │   ├── layout.tsx, page.tsx, globals.css
│   │   └── middleware.ts (repo root, not app/)      Role gate — see rule 01 §3
│   ├── components/
│   │   ├── layout/     Navbar, Footer, PrefetchLink, cart badge, etc.
│   │   ├── providers/  Client-side context providers (React Query client, etc.)
│   │   └── ui/         Small shared primitives (buttons, inputs)
│   ├── lib/
│   │   ├── auth/        Session, roles, guards
│   │   ├── cache/       unstable_cache-wrapped read getters (adminData.ts, publicData.ts)
│   │   ├── cart/        Cart service + local-first client store
│   │   ├── email/       Transactional email sending
│   │   ├── orders/      Order service + state machine
│   │   ├── payments/    Bachs client + payment service + state machine
│   │   ├── queries/     Client-side prefetch helpers (TanStack Query)
│   │   ├── validation/  Zod schemas (single file: schemas.ts)
│   │   ├── hooks/       Shared React hooks
│   │   ├── currency.ts, errors.ts, prisma.ts, supabase.ts
│   ├── middleware.ts
├── prisma/               schema.prisma, migrations/, seed.ts
├── tests/{unit,integration}/
├── docs/rules/           Engineering rules (this directory)
└── CLAUDE.md
```

---

## 2. Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| React component file | PascalCase.tsx | `AdminMenuClient.tsx` |
| Page file | Next.js convention | `page.tsx`, `layout.tsx` |
| Service module | `service.ts` inside `lib/{domain}/` | `src/lib/orders/service.ts` |
| Cache getter module | `{surface}Data.ts` inside `lib/cache/` | `adminData.ts`, `publicData.ts` |
| Route handler | Next.js convention | `src/app/api/orders/route.ts`, `[id]/route.ts` |
| Zod schema | `{noun}{Action}Schema` | `menuItemCreateSchema` |
| Test file | mirrors source path under `tests/{unit,integration}/` | `tests/integration/payments.webhook.test.ts` |

---

## 3. Where to Put New Code

| Adding… | Location |
|---|---|
| New API endpoint | `src/app/api/{domain}/route.ts` (+ `[id]/route.ts` for item routes) |
| New business logic / mutation | `src/lib/{domain}/service.ts` |
| New cached read | `src/lib/cache/adminData.ts` or `publicData.ts` — new `unstable_cache` export |
| New Zod schema | `src/lib/validation/schemas.ts` |
| New admin page | `src/app/admin/{feature}/page.tsx` (thin) + a `{Feature}Client.tsx` island if interactive |
| New customer-facing page | `src/app/{route}/page.tsx` |
| New shared layout component | `src/components/layout/` |
| New client-side prefetch helper | `src/lib/queries/{domain}.ts` |
| New Prisma model/field | `prisma/schema.prisma` → `pnpm db:migrate` — never hand-edit `prisma/migrations/` |

---

## 4. Import Rules

```typescript
// Good — alias
import { getAdminOrdersData } from "@/lib/cache/adminData";

// Bad — deep relative
import { getAdminOrdersData } from "../../../lib/cache/adminData";
```

- Pages import from `lib/cache` or `lib/{domain}/service.ts` — never `prisma` directly (rule 01 §1.1)
- `lib/{domain}/service.ts` may import `lib/prisma`, `lib/errors`, other services — never `app/**` or `components/**`
- `lib/cache/*.ts` may import `lib/{domain}/service.ts` and `lib/prisma` — never `next/server`

---

## 5. Established Paths (Do Not Relocate)

- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/errors.ts` — `ApiError` / `toErrorResponse`
- `src/middleware.ts` — role gate
- `src/lib/validation/schemas.ts` — Zod schema registry
- `prisma/schema.prisma` — data model source of truth

---

## 6. Related

- `docs/rules/01-architecture.md`
- `docs/rules/05-component-architecture.md`
