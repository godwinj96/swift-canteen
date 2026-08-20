# Swift Canteen — Error Handling Rules
**Section 10 of 13 · v1.0**

---

## 0. The Existing Pattern

`src/lib/errors.ts` already defines the pattern — extend it, don't
reinvent it per feature:

```typescript
export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;
}

export function toErrorResponse(error: unknown): { status: number; body: { error: string; details?: unknown } }
export function getErrorMessage(error: unknown): string   // client-side friendly message
```

| Layer | Responsibility |
|---|---|
| `lib/{domain}/service.ts` | Throws `ApiError` for expected failure states (not found, invalid transition, insufficient stock) |
| Route handler | Catches with `toErrorResponse(error)`, returns the correct status |
| Client component | Uses `getErrorMessage(error)` to render a user-facing message; never renders a raw error object or stack trace |

---

## 1. User-Facing Feedback

| Situation | Pattern |
|---|---|
| Mutation success | Toast (`sonner`) + rely on cache invalidation (rule 06) for the UI to reflect it — don't hand-patch local state instead of invalidating |
| Validation error | Inline field error, not only a toast |
| Auth expired / 401 | Redirect to login, preserving return intent where practical |
| 403 | Clear "you don't have permission" state, not a silent no-op |
| 404 | Explicit empty/not-found state |
| 5xx / network | Generic retry message — never leak internal error text to the customer |

Never `window.alert()` / `window.confirm()` for user-facing flow — use a real
dialog component and `sonner` toasts.

---

## 2. Query/Fetch Error States

Every data-driven view handles all three states, not just the happy path:

```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
if (!data?.length) return <EmptyState />;
```

---

## 3. Loading States

- Skeletons should roughly match the shape of the real content (card/list-row
  outlines), not a generic spinner, for anything above a trivial load time
- Disable + spinner on the triggering button during a mutation, not a
  full-page blocking overlay when partial UI can still render

---

## 4. Server-Side Logging

- `console.error` the full error in `toErrorResponse()`'s fallback branch —
  that's already correct, keep doing it — but never let the *client-facing*
  response include it
- Don't log payment webhook bodies or auth request bodies at their full
  contents (rule 09 §5)

---

## 5. Related

- `docs/rules/04-api-layer.md` §4
- `docs/rules/09-security.md` §5
- `src/lib/errors.ts`
