<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **swift-canteen** (788 symbols, 1948 relationships, 58 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/swift-canteen/context` | Codebase overview, check index freshness |
| `gitnexus://repo/swift-canteen/clusters` | All functional areas |
| `gitnexus://repo/swift-canteen/processes` | All execution flows |
| `gitnexus://repo/swift-canteen/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

# Engineering Rules

**Before working on any feature in this repo, read `docs/rules/README.md`
and the rule file(s) relevant to the surface you're touching.** These are
project-specific conventions — ported and adapted from another project's
rule set to this app's actual stack (Next.js App Router + Prisma, no
separate backend) — and they take precedence over generic framework
defaults for this repo. Several of them exist because of real incidents in
this codebase (an `unstable_cache`/`revalidateTag` invariant crash, an RSC
function-prop crash, a missing-env-var payment 500), not hypothetical advice.

| Always read | For |
|---|---|
| `docs/rules/01-architecture.md` | Layer contract: pages → route handlers → services → cache/Prisma |
| `docs/rules/04-api-layer.md` | Route handler conventions, env vars |
| `docs/rules/09-security.md` | Auth, payments, secrets |

| Read when touching… | File |
|---|---|
| Data fetching, cart, forms | `docs/rules/03-state-management.md` |
| Components, RSC boundaries | `docs/rules/05-component-architecture.md` |
| Caching, prefetching, perceived latency | `docs/rules/06-caching-and-performance.md` |
| Layout/CSS | `docs/rules/07-responsiveness.md` |
| Forms or API payload shapes | `docs/rules/08-input-validation.md` |
| Routes or mutations (error handling) | `docs/rules/10-error-handling.md` |
| Adding/changing behavior (tests) | `docs/rules/11-testing.md` |

Full index and rationale: [`docs/rules/README.md`](docs/rules/README.md).
Port history from the source project: [`docs/rules/SOURCE-MATRIX.md`](docs/rules/SOURCE-MATRIX.md).
