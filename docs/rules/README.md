# Engineering Rules Index

Canonical rules for Swift Canteen. Ported and adapted from `gradpreneur-web/docs/rules`
(a Vite/TanStack Router SPA) to this project's actual stack: **Next.js 15 App Router,
React 19, Prisma + Supabase Postgres, Tailwind CSS 4, Zod, Vitest**. Anything specific
to the source project that doesn't apply here (TanStack Router, Zustand, WebSockets,
a separate Go backend, mobile parity, Stripe Elements) was dropped rather than carried
over — see [SOURCE-MATRIX.md](./SOURCE-MATRIX.md) for exactly what changed and why.

| # | File | Load |
|---|------|------|
| 01 | [architecture.md](./01-architecture.md) | Always |
| 02 | [folder-structure.md](./02-folder-structure.md) | When adding files |
| 03 | [state-management.md](./03-state-management.md) | When touching data fetching/cart/forms |
| 04 | [api-layer.md](./04-api-layer.md) | Always |
| 05 | [component-architecture.md](./05-component-architecture.md) | When touching components |
| 06 | [caching-and-performance.md](./06-caching-and-performance.md) | When touching data fetching, prefetch, or perceived latency |
| 07 | [responsiveness.md](./07-responsiveness.md) | When touching layout/CSS |
| 08 | [input-validation.md](./08-input-validation.md) | When touching forms or API payloads |
| 09 | [security.md](./09-security.md) | Always |
| 10 | [error-handling.md](./10-error-handling.md) | When touching routes or mutations |
| 11 | [testing.md](./11-testing.md) | When adding/changing behavior |
| 12 | [dx-tooling.md](./12-dx-tooling.md) | Always |
| 13 | [claude-md-protocol.md](./13-claude-md-protocol.md) | When conventions change |

Start with [`CLAUDE.md`](../../CLAUDE.md) at repo root — it points here and to the
GitNexus code-intelligence workflow.

**Precedence:** these rules are project-specific and take precedence over generic
guidance for this repo. Where a rule here conflicts with a general-purpose framework
convention, follow this file.
