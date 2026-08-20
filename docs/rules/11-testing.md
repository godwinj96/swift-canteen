# Swift Canteen — Testing Rules
**Section 11 of 13 · v1.0**

---

## 0. Stack

- **Vitest** (`pnpm test` / `pnpm test:watch`)
- **`node-mocks-http`** for integration tests that exercise a route handler
  or service function against a real (test) Postgres transaction
- No E2E framework yet — manual QA in the browser for UI flows; consider
  Playwright if/when this app's surface area justifies it

---

## 1. What to Test

| Layer | Priority | Approach |
|---|---|---|
| State machines (`orders/stateMachine.ts`, `payments/stateMachine.ts`) | High | Unit tests — every valid/invalid transition |
| `lib/{domain}/service.ts` functions | High | Integration tests against a real transaction (`tests/integration/`) |
| Zod schemas | Medium | Valid/invalid case coverage for anything with non-trivial constraints |
| Route handlers | Medium | Covered indirectly via the integration tests that call through them, or directly with `node-mocks-http` for auth/webhook-signature edge cases |
| Pure utils (`currency.ts`, formatters) | Medium | Unit tests |
| Components | Low-medium | Manual QA is currently primary; add RTL tests for logic-heavy client components as the suite grows |

---

## 2. File Placement

`tests/unit/{mirrors src path}` and `tests/integration/{feature}.test.ts` —
matches the existing layout (`tests/unit/lib/orders/stateMachine.test.ts`,
`tests/integration/payments.webhook.test.ts`).

---

## 3. A Constraint That Has Already Caused Failures

Service functions must be safely callable directly by a test, with no live
Next.js request context. This means:

- **Never call `revalidateTag()` inside a service function** (rule 01 §1.1,
  rule 06 §2) — it throws `Invariant: static generation store missing`
  outside a real request, which is exactly the situation a test invokes the
  service in. This has broken 8 tests in this project already; the fix was
  moving every `revalidateTag` call into the route handler.
- If a test needs to assert cache invalidation happened, assert it at the
  route-handler level (or mock `revalidateTag` and check it was called with
  the right tags), not by calling the service function and expecting
  invalidation to occur.

---

## 4. Integration Test Conventions

```typescript
import { describe, it, expect } from "vitest";

describe("reconcilePaymentStatus", () => {
  it("confirms the order when payment succeeds", async () => {
    // Arrange — seed a PENDING order + payment
    // Act — call the service function directly
    // Assert — order status, no revalidateTag call inside the service
  });
});
```

- Prefer Arrange-Act-Assert
- Descriptive test names stating the behavior, not the implementation
- A transaction-timeout flake against the pooled Supabase connection has
  occurred before and is a known, pre-existing source of occasional flake in
  the webhook idempotency test — confirm via an isolated re-run before
  treating a failure there as a regression from your change

---

## 5. CI Gate

Before considering any change done:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src
pnpm test
```

All three clean, or a documented reason (confirmed-flaky, re-run passing) for
any remaining red.

---

## 6. Related

- `docs/rules/01-architecture.md` §1.1
- `docs/rules/06-caching-and-performance.md` §2
