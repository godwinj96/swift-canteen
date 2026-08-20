# Swift Canteen — DX & Tooling Rules
**Section 12 of 13 · v1.0**

---

## 0. Toolchain

| Tool | Purpose |
|---|---|
| pnpm | Package manager — use `pnpm`, not `npm`/`yarn`, so the lockfile stays consistent |
| Next.js 15 (App Router) | Framework |
| TypeScript strict | Type safety |
| ESLint (`eslint-config-next`) | Linting — `pnpm lint` |
| Prisma | ORM + migrations |
| Vitest | Tests |

---

## 1. Path Alias

`@/*` → `src/*` (see `tsconfig.json`). Always use it inside `src/` — no deep
`../../../` relative imports.

---

## 2. Scripts

| Script | Use |
|---|---|
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint over `src` |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm db:migrate` | `prisma migrate dev` — never hand-edit files under `prisma/migrations/` |
| `pnpm db:seed` | Runs `prisma/seed.ts` |
| `pnpm db:studio` | Prisma Studio |

`postinstall` runs `prisma generate` automatically — don't add a manual step
for it.

---

## 3. Code Style

- No `any` — use `unknown` and narrow
- Explicit return types on exported service/API functions
- `console.log` removed before a change is considered done; `console.error`
  is fine in the specific catch-and-log paths this codebase already
  establishes (`toErrorResponse`'s fallback branch)
- Named exports for feature components (matches existing convention)

---

## 4. Git

- Small, focused commits/PRs per feature
- Never commit `.env` — `.env.example` documents every required key with a placeholder
- Don't skip pre-commit hooks (`--no-verify`) or bypass GPG signing unless the user explicitly asks

---

## 5. AI Assistant Workflow (Claude Code / any agent working in this repo)

1. Read `CLAUDE.md` (repo root) and the relevant `docs/rules/*.md` file(s) for the surface being touched
2. Before editing any symbol: run GitNexus `impact({target, direction: "upstream"})` per `CLAUDE.md`'s mandatory rule, and report blast radius
3. Implement per the layer contract (rule 01)
4. Run `tsc --noEmit`, `eslint src`, and `pnpm test` before calling anything done
5. Run GitNexus `detect_changes()` before committing; warn on HIGH/CRITICAL risk per `CLAUDE.md`
6. Update `docs/rules/` per rule 13 when a convention actually changes — not for one-off implementation details

---

## 6. Related

- `docs/rules/13-claude-md-protocol.md`
- `CLAUDE.md`
