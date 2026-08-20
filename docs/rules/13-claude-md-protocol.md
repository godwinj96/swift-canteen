# Swift Canteen — CLAUDE.md Maintenance Protocol
**Section 13 of 13 · v1.0**

*Adapted from the source project's AGENTS.md protocol — this repo uses
`CLAUDE.md` as its single entry index instead of a separate `AGENTS.md` +
`.cursor/rules/` sync pair, since this repo doesn't maintain Cursor rule files.*

---

## 0. Source of Truth

| Artifact | Role |
|---|---|
| `docs/rules/*.md` | Canonical, human-readable engineering rules (this directory) |
| `CLAUDE.md` (repo root) | Entry index — GitNexus workflow + pointer to `docs/rules/` |
| `docs/rules/SOURCE-MATRIX.md` | Record of what was ported from `gradpreneur-web` and why |

There is no separate `.cursor/rules/` sync step in this repo — `docs/rules/`
is read directly.

---

## 1. When to Update Rules

Update `docs/rules/` when:

- A new architectural pattern is introduced (new cache layer, new state
  pattern, new payment provider)
- A cross-cutting convention changes (error handling shape, validation
  approach, role-gating mechanism)
- A real bug reveals a constraint worth encoding for next time (e.g. the
  `revalidateTag`-in-service-layer failure mode, or the RSC function-prop
  crash — both are already captured in rules 01, 05, 06, 11 precisely because
  they were real incidents, not hypotheticals)

Do **not** update rules for one-off implementation details specific to a
single feature.

---

## 2. Update Procedure

1. Edit the relevant `docs/rules/NN-name.md`
2. If the change adds/renames a file, update `docs/rules/README.md`'s table
3. If the change reflects a new incident/gotcha, name it concretely (what
   broke, why, what the fix was) rather than writing an abstract warning —
   concrete failure modes are what make a rule file actually useful to a
   future agent instead of generic advice it'll skim past

---

## 3. Always-Apply Files

These should be treated as loaded for every session working in this repo:

- `01-architecture.md`
- `04-api-layer.md`
- `09-security.md`

---

## 4. Related

- `CLAUDE.md`
- `docs/rules/README.md`
- `docs/rules/SOURCE-MATRIX.md`
