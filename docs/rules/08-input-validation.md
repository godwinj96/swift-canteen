# Swift Canteen — Input Validation Rules
**Section 8 of 13 · v1.0**

---

## 0. Principles

1. **Validate on the client for UX, trust the server as authority.** Every
   mutation is re-validated server-side regardless of what the client already checked.
2. **Zod is the schema layer** — one registry file, `src/lib/validation/schemas.ts`.
3. **Inline field errors**, not only a toast — a toast alone doesn't tell the
   user *which* field is wrong.
4. Map server-side Zod `.parse()` failures back to the client in a form the UI
   can render per-field, not just a flat error string, wherever the form has
   more than one field.

---

## 1. Schema Location

All schemas live in `src/lib/validation/schemas.ts`, one export per shape:

```typescript
export const menuItemCreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
});
```

Reuse/`.partial()` an existing schema for the corresponding update shape
(e.g. `categoryUpdateSchema = categoryCreateSchema.partial()`) rather than
duplicating fields.

---

## 2. Route Handler Usage

```typescript
const body = orderStatusUpdateSchema.parse(await request.json());
```

A thrown `ZodError` is caught by `toErrorResponse()` (rule 10) and returned
as a 400 with details — never let it surface as an unhandled 500.

---

## 3. Common Field Rules

| Field | Rule |
|---|---|
| Email | `z.string().email()` |
| Password | `min(8).max(100)` — match whatever the auth service actually enforces |
| Price | `z.number().positive()` — Prisma/DB stores the authoritative value; never trust a client-submitted price at checkout without re-deriving it server-side from the menu item |
| IDs used in a Prisma query | validate as non-empty string / expected format before use — a malformed id should 400, not reach Prisma as a query that silently matches nothing |
| Phone | `max(20)`, optional where the schema already reflects that |

---

## 4. UX Patterns

- Disable submit while a mutation is in flight
- Confirm destructive actions (delete menu item, cancel order) via a real
  confirmation dialog — never fire on a single click with no undo
- `autocomplete` attributes on auth fields (`email`, `current-password`,
  `new-password`)
- Never log password fields, even at debug level

---

## 5. Related

- `docs/rules/04-api-layer.md`
- `docs/rules/09-security.md`
- `docs/rules/10-error-handling.md`
