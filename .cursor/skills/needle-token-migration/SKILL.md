---
name: needle-token-migration
description: Migrate raw hex values, inline styles, and off-token usage in Needle's React components to semantic design tokens. Use when the user wants to clean up inline styles, replace hardcoded colors, enforce token discipline, or refactor a component to use the design system properly. One component at a time, with explicit before/after diffs.
---

# Needle Token Migration

Narrow-bridge skill. Replaces off-token usage in components with semantic tokens, one file at a time, with verification.

## When to use

Triggers:
- "Clean up inline styles in X"
- "Replace hex values with tokens"
- "Migrate X to use the design system"
- "Why is `#666` in this file"
- After `needle-ui-audit` flags discipline violations

## Pre-requisites

The target component must be named explicitly. Do NOT migrate every file at once — that's an unbounded refactor. One component per invocation.

## Process — one file at a time

### Step 1 — Read the file fully

Read the entire target file. Note every:
- Raw hex value (`#xxx`)
- Raw rgb/rgba/hsl
- Hardcoded font-size, font-weight, line-height (off the scale in `tokens.css`)
- Inline style object with > 2 properties (extraction candidate)
- Class names that wrap inline color logic

### Step 2 — Build the migration table

For each off-token value, propose the semantic token to replace it with. Show as a table:

```
Line  Old                                  →  New                          Why
─────────────────────────────────────────────────────────────────────────────
42    color: '#666'                        →  color: 'var(--ink-3)'        secondary text
57    background: 'rgba(0,0,0,0.14)'       →  box-shadow uses --hairline-2 not raw rgba
89    fontSize: 12.5                       →  fontSize: 12                 snap to scale
```

If a needed semantic token doesn't exist, STOP. Propose a new token via `needle-add-token` first.

### Step 3 — Verify token availability

For every proposed token, confirm it's defined in BOTH light and dark blocks of `tokens.css`. If not, the token doesn't exist yet — go back to Step 2 and propose adding it.

### Step 4 — Confirm before editing

Show the user the full migration table. Ask: *"Apply these N changes to `<file>`? Confirm to proceed."*

Do not edit until confirmation.

### Step 5 — Apply changes

- Edit the single target file. Do not branch into other files in the same invocation.
- Preserve everything else: layout, behavior, props, tests.
- If a large inline style block has 4+ properties, extract it to a CSS class in `global.css` (or the appropriate stylesheet) and reference the class instead.

### Step 6 — Verify

- Run `npm run typecheck` — must pass.
- Run `npm run lint` — must pass.
- Update `design/components.md` for this component (status moves from `mvp` → `tokenized`).
- Log in `design/decisions.md` if any new tokens were introduced.

## What this skill MUST NOT do

- Migrate more than one file per invocation. Bound the blast radius.
- Introduce new tokens silently. Use `needle-add-token` (or call it out explicitly).
- Change behavior. This is purely a token-substitution refactor.
- Reformat unrelated code. Stay in scope.
- Delete or rename props.

## Anti-patterns this skill catches

| Pattern in code | Replacement |
|-----------------|-------------|
| `style={{ color: '#666' }}` | `style={{ color: 'var(--ink-3)' }}` or move to class |
| `box-shadow: 0 6px 24px rgba(0,0,0,0.14)` | Use `--shadow-card` (or define if missing) |
| `border: '1.5px solid #ddd'` | `border: '1.5px solid var(--border-default)'` |
| 4+ inline style props per element | Extract to class in `global.css` |
| `var(--sand-50)` (primitive) in component | Replace with semantic role |

## Verifying this skill worked

- Target file has zero raw hex/rgb in `.tsx`
- All semantic tokens used exist in both light and dark blocks
- Typecheck and lint pass
- No behavior change (same props, same rendering shape)
- `design/components.md` updated for this component
