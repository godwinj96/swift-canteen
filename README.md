# Swift Canteen

A web-based food ordering system for a campus canteen. Customers browse the menu, order, and
pay online; canteen staff manage the menu and process orders from an admin dashboard.

## Stack

- Next.js (App Router, TypeScript) + Tailwind CSS
- PostgreSQL via [Supabase](https://supabase.com) + Prisma ORM
- Hand-rolled JWT/httpOnly-cookie auth (`jose`, `bcryptjs`)
- Bachs hosted checkout for payments (webhook-confirmed)
- Vitest for unit + integration tests

## Setup

1. Create a [Supabase](https://supabase.com) project and grab both connection strings from
   **Project Settings → Database → Connection string**: the Transaction pooler (port 6543) and
   the Session/direct connection (port 5432).
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (pooler), `DIRECT_URL` (direct),
   and a random `AUTH_SECRET`.
3. Install dependencies and apply the schema:

```bash
pnpm install
pnpm db:migrate   # prisma migrate dev
pnpm db:seed      # admin user + sample categories/menu items
pnpm dev          # http://localhost:3000
```

Seeded admin login: `admin@swiftcanteen.dev` / `Admin123!`.

## Testing

```bash
pnpm test
```

Unit tests cover auth (JWT, password hashing) and the order/payment state machines. Integration
tests exercise order placement and the Bachs webhook flow against the real database — they
require `DATABASE_URL`/`DIRECT_URL` to be set and migrations applied.

## Bachs payment integration

`BACHS_*` env vars are placeholders until real credentials are available. The integration is
isolated behind `src/lib/payments/bachsClient.ts` so swapping in real credentials doesn't touch
the rest of the app.
