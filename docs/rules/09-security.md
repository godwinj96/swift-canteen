# Swift Canteen — Security Rules
**Section 9 of 13 · Always Apply · v1.0**

---

## 0. Security Posture

This app handles authentication credentials, payment redirects, and customer
PII (names, phone numbers, order history). Three axioms:

1. **Never trust input** — validate and sanitize from every source (rule 08)
2. **Least privilege** — the client holds only what it needs, as long as needed
3. **Fail closed** — on ambiguity, deny and require explicit confirmation

---

## 1. Session & Auth

- Session token: JWT in an **httpOnly, secure** `session` cookie, verified
  with `jose` (`AUTH_SECRET`) — never store the session token in localStorage
  or a client-readable cookie.
- `src/middleware.ts` is the single choke point for role gating (rule 01 §3).
  Route/page-level checks (`requireRole`, `requireAuth`) are defense-in-depth,
  not the primary gate.
- Password reset tokens are single-use and short-lived — never log them.
- Password hashing via `bcryptjs` — never store or log a plaintext password.

---

## 2. Payments (Bachs)

- All Bachs API calls go through `src/lib/payments/bachsClient.ts` — never
  call the Bachs API from a component or another service directly.
- **Every required credential must actually be present in `.env` before the
  checkout flow is exercised**: `BACHS_API_KEY`, `BACHS_BASE_URL`,
  `BACHS_WEBHOOK_SECRET`. A missing `BACHS_WEBHOOK_SECRET` throws
  `Bachs API credentials are not configured` — this is a **configuration**
  failure, not a code defect, and has caused a real "500 on Pay Now" incident
  in this project. Before debugging a payment 500 as a code problem, confirm
  every payment-related env var actually has a non-empty value (a variable
  present in `.env.example` does not mean it's set in `.env`).
- Webhook signature verification (`verifyWebhookSignature`) is mandatory on
  every webhook request before the payload is trusted — never process an
  unverified webhook body.
- Payment state transitions go through the payment state machine
  (`assertOrderTransition` / equivalent) — never write `status: "CONFIRMED"`
  ad hoc from a route handler.
- No card data ever touches our servers — Bachs checkout is a hosted redirect.

---

## 3. Secrets & Configuration

**Never in the git-tracked source or client bundle:**

- `AUTH_SECRET`, `BACHS_API_KEY`, `BACHS_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — the anon/publishable key is the
  only Supabase key that may reach the client)
- `SENDLIB_API_KEY`
- `DATABASE_URL` / `DIRECT_URL`

`.env.example` documents every variable's name and purpose with a placeholder
value — real values live only in `.env` (gitignored) and the deployment
platform's secret store. When adding a new required env var, update
`.env.example` in the same change.

---

## 4. Input & Output Safety

- Validate every mutation payload with Zod before it reaches a service function (rule 08)
- Never `dangerouslySetInnerHTML` with user-supplied content
- Menu item images: only render from the allow-listed host(s) in
  `next.config.ts`'s `remotePatterns` — a stale DB row pointing at a
  since-removed host should fail loudly in dev, not silently 404 in prod
- File uploads (if/when added): validate content-type and size server-side, never trust a client-reported MIME type alone

---

## 5. Error & Logging Discipline

- Never log tokens, passwords, OTPs, or webhook secrets — including in
  `console.error` inside a catch block
- `toErrorResponse()` (rule 10) already strips internal error details from
  the client-facing response — don't bypass it with a hand-rolled
  `NextResponse.json({ error: String(e) })`

---

## 6. Prohibitions

| Never | Why |
|---|---|
| Store the session JWT in localStorage or a non-httpOnly cookie | XSS token theft |
| Skip `middleware.ts`'s role gate for a "just this one internal route" | IDOR risk |
| Process a Bachs webhook without signature verification | Forged payment confirmations |
| Commit `.env` | Credential leak |
| Trust a client-submitted price or availability flag at order creation | Always re-derive from the DB server-side |

---

## 7. Related

- `docs/rules/01-architecture.md` §3 — role gating
- `docs/rules/04-api-layer.md` §1 — env vars
- `docs/rules/08-input-validation.md`
