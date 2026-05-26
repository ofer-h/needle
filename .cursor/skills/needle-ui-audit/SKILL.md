---
name: needle-ui-audit
description: Audit Needle's UI — inventory components, find inconsistencies, measure contrast, identify gaps against the design system. Use when the user asks to audit the UI, review components, find what's missing, check contrast, or assess design system maturity. Produces a structured report and updates design/components.md.
---

# Needle UI Audit

Produce a structured audit of Needle's UI: what exists, what's missing, what's broken. Updates `design/components.md` with findings.

## When to use

Triggers:
- "Audit the UI" / "review the design"
- "What components do we have"
- "Check contrast / accessibility"
- "What's missing from the design system"
- "Find inline styles / raw hex values"

## Process — follow in order

### Phase 1 — Inventory (read-only)

1. Read `design/components.md` to see the current documented inventory.
2. Glob `src/renderer/components/**/*.tsx`. For each file:
   - Read the component
   - Record: name, file path, purpose, props, variants, internal/exported sub-components
3. Glob `src/renderer/styles/*.css`. Note token usage and class definitions.

### Phase 2 — Discipline checks (per `design/anti-patterns.md`)

Search for:
- Raw hex values in `.tsx` files: regex `#[0-9a-fA-F]{3,8}` inside `style={{` or `style="`
- Inline `style={{` blocks with more than 2 properties → candidate for class extraction
- Primitive token references in component code (e.g. `var(--sand-50)` instead of a semantic name)
- Components that hardcode their layout (margins, positions) instead of letting the parent place them

Group findings by component. Don't list raw matches — summarize per file.

### Phase 3 — Contrast audit

For each token pairing in `tokens.css`, compute WCAG 2.2 contrast for both themes:

| Pairing | Light ratio | Dark ratio | Pass AA (4.5:1)? |
|---------|-------------|------------|------------------|
| `--ink` on `--bg` | … | … | … |
| `--ink-2` on `--bg` | … | … | … |
| `--ink-3` on `--bg` | … | … | … |
| (etc.) | | | |

Flag every fail. Note where each token is actually used (search call sites) so the fix can be scoped.

### Phase 4 — Gap analysis vs PRD

Read `PRD.md`. List screens/states from the PRD that have no current implementation. Mark them in `design/components.md` as `status: planned`.

### Phase 5 — Report

Produce the report inline (do NOT save as a new file — keep it conversational), with these sections:

1. **Component inventory** — table: name | location | purpose | status
2. **Discipline violations** — grouped by component, with severity (blocker / nit)
3. **Contrast failures** — table from Phase 3, only failures
4. **Coverage gaps** — what's planned but unbuilt
5. **Recommended next actions** — which skill to invoke next (`needle-dark-mode-fix` if contrast fails, `needle-token-migration` if discipline issues, `needle-build-component` if gaps need filling)

### Phase 6 — Update docs

Update `design/components.md` with the latest inventory. Log this audit in `design/decisions.md` (date, scope, findings count). Do NOT modify any application code in this phase.

## What this skill MUST NOT do

- Fix anything. Audit is read-only + docs-only. Refactors are separate skills.
- Skip the report. The user needs the structured output.
- Use vague severity terms ("might want to look at…"). Be specific: blocker, nit, or out-of-scope.

## Verifying this skill worked

- A complete inventory exists in `design/components.md`
- Every contrast failure has a token pair name + ratio + where it's used
- The user knows exactly which skill to invoke next
