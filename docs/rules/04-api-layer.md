# Swift Canteen — API Layer Rules
**Section 4 of 13 · Always Apply · v1.0**

---

## 0. Guiding Principles

1. **Route Handlers are thin** — parse, validate, delegate to a service, revalidate, respond. No business logic, no Prisma calls inline.
2. **Typed in, typed out** — Zod schema on the way in; Prisma-generated types (or a small mapped shape) on the way out. No `any`.
3. **Typed errors** — throw `ApiError` (`src/lib/errors.ts`) from the service layer; the route handler catches with `toErrorResponse()`.
4. **Auth via middleware first, guard functions second** — `src/middleware.ts` is the primary gate (rule 01 §3); `requireRole()`/`requireAuth()` helpers inside a handler are defense-in-depth, not the only check.

---

## 1. Environment

```bash
# .env (never committed — see .env.example for the full list)
DATABASE_URL=...
DIRECT_URL=...
AUTH_SECRET=...
BACHS_API_KEY=...
BACHS_BASE_URL=...
BACHS_WEBHOOK_SECRET=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SENDLIB_API_KEY=...
SENDLIB_FROM_EMAIL=...
APP_URL=...
```

Every one of these is read server-side only. If a code path that needs one
throws "not configured," **the fix is the missing env var, not a code
workaround** — see rule 09 §5 on the Bachs credential-missing failure mode
specifically, since it's bitten this project before.

---

## 2. Request Flow

```
page.tsx / Client Component
  → (mutation) fetch('/api/{domain}', { method, body })
  → Route Handler: schema.parse(body) → service function → revalidateTag(...) → NextResponse.json
  → (read, from a Server Component) getCachedXData() directly — no HTTP round trip to your own API
```

### 2.1 Route Handler Pattern

```typescript
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("STAFF");
    const { id } = await params;
    const body = orderStatusUpdateSchema.parse(await request.json());
    const order = await updateOrderStatus(id, body.status);
    revalidateTag("orders");
    revalidateTag("admin-orders");
    revalidateTag("admin-dashboard");
    revalidateTag("admin-reports");
    return NextResponse.json({ order });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
```

Every mutating route follows this shape: guard → parse → service call →
revalidate every tag the mutation affects → respond. See rule 06 §2 for the
full tag map — a mutation that forgets a tag leaves stale data visible for up
to the cache's `revalidate` window.

### 2.2 Server-Component Reads Skip HTTP

A Server Component fetching data for its own render calls the cache/service
layer directly (`await getAdminOrdersData()`), not `fetch('/api/dashboard/orders')`.
Route Handlers exist for client-triggered mutations and for any read a Client
Component needs after mount (e.g. via a TanStack Query hook) — not as a
mandatory indirection layer for server-side reads.

---

## 3. Types

No wire/app DTO split — Prisma's generated client types are the source of
truth. Where a route/page needs a shape Prisma doesn't produce directly
(joined/aggregated data), map it once inside the service or cache-getter
function and return a plain, named type — don't scatter ad-hoc `any`-typed
mapping in the route handler or page.

---

## 4. Error Handling in the API Layer

`ApiError(status, message, details?)` from `src/lib/errors.ts`.

| Status | Typical meaning |
|---|---|
| 400 | Validation failure (Zod `.parse()` throws → caught by `toErrorResponse`) |
| 401 | Not authenticated |
| 403 | Authenticated but wrong role |
| 404 | Not found |
| 409 | Invalid state transition (order/payment state machine) |
| 500 | Unexpected — `toErrorResponse` logs it and returns a generic message, never the raw error, to the client |

---

## 5. Module Organization

One `service.ts` per domain under `src/lib/{domain}/`: `auth`, `cart`,
`orders`, `payments`. Route handlers live under the matching
`src/app/api/{domain}/` path. Keep the two in sync — a service function with
no route handler calling it, or a route handler with inline logic instead of
a service call, is a sign the layering has drifted (rule 01 §1.1).

---

## 6. Prohibitions

- `prisma.*` calls inside a route handler — always go through a service function
- `revalidateTag()` inside a service function (rule 01 §1.1, rule 06 §2)
- Swallowing an error and returning `200` with an `{ ok: false }` body — use the correct HTTP status
- Logging request bodies that contain passwords or payment webhook secrets

---

## 7. Related

- `docs/rules/01-architecture.md` — layer contract
- `docs/rules/06-caching-and-performance.md` — cache tags and invalidation
- `docs/rules/09-security.md` — secrets, webhook verification
- `docs/rules/10-error-handling.md`
