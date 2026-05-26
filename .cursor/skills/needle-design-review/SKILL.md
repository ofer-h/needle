---
name: needle-design-review
description: Review a UI change against Needle's design system before merging. Use when the user asks to review a UI change, design review, before merging UI, sanity check, "is this aligned with the system", or after building/refactoring a component. Produces a structured 5-dimension review report and gates on must-fixes.
---

# Needle — Design Review

Final-check skill. Runs a UI change against the design system on 5 dimensions and decides: green, yellow, red. The going-forward safety net so refactors and new components don't quietly drift.

## When to use

Triggers:
- "Review this change before I merge"
- "Sanity check the component I just built"
- "Is this aligned with the design system?"
- After `needle-build-component`, `needle-token-migration`, `needle-dark-mode-fix` finishes — the user wants confirmation it's clean
- Before opening a PR that touches UI

## Process

### Step 0 — Identify scope

Ask (or infer) what's in scope: which files, which component, which feature. If you can't answer "what changed and what should I review," stop and clarify.

### Step 1 — Five-dimension review

Score each dimension as ✅ green / ⚠️ yellow / ❌ red. Each finding cites the file + line.

#### Dimension 1 — Token discipline

- ✅ Only semantic tokens referenced.
- ⚠️ Primitive token (`--sand-50`) used in a component.
- ❌ Raw hex / rgb / hsl in `.tsx` file.

Check with: `rg "#[0-9a-fA-F]{3,8}" src/renderer/components/<scope>` and look for `var(--sand-` or other primitive prefixes.

#### Dimension 2 — Accessibility

- ✅ Every interactive element has visible focus + `aria-label` if not visually labelled.
- ✅ All token pairs pass WCAG 2.2 AA (compute contrast for each pair touched).
- ⚠️ Focus visible but uses `outline: none` with custom replacement.
- ❌ `outline: none` with no replacement, missing `aria-label`, or failing contrast.

#### Dimension 3 — Component API

- ✅ Props as `type Props = {…}` above the component. Variants are unions. States all handled.
- ⚠️ Boolean flags that imply variant (e.g. `isPrimary`).
- ⚠️ Missing one of: hover, focus-visible, disabled.
- ❌ Inline `React.FC`, props inline, missing state coverage that affects users.

#### Dimension 4 — macOS feel

- ✅ Spacing snaps to 4/8/12/16/20/24/32/40/56. Radii to 4/6/8/12/16/999. Motion durations 100–300ms.
- ⚠️ One or two off-scale values with no rationale.
- ❌ Multiple off-scale values, missing keyboard equivalents for primary actions.

#### Dimension 5 — Documentation parity

- ✅ `design/components.md` entry exists and matches the implementation (props, variants, status).
- ⚠️ Entry exists but is out of date.
- ❌ No entry, or entry contradicts the code.

### Step 2 — Aggregate verdict

| Reds | Yellows | Verdict |
|------|---------|---------|
| 0 | 0 | 🟢 Ship it |
| 0 | ≥1 | 🟡 Ship with follow-ups logged (record in `design/decisions.md`) |
| ≥1 | — | 🔴 Must-fix before merge |

### Step 3 — Report

Print the review in this exact shape so it's scannable:

```
Needle Design Review — <component or scope>

Dim 1 Token discipline      ✅
Dim 2 Accessibility         ⚠️
  - TaskRow.tsx:142 — drag handle has no aria-label
Dim 3 Component API         ✅
Dim 4 macOS feel            ✅
Dim 5 Docs parity           ⚠️
  - components.md missing `done` state in TaskRow entry

Verdict: 🟡 Ship with follow-ups
Must-fix: none
Follow-ups: 2 (logged in design/decisions.md)
```

### Step 4 — Log follow-ups

If verdict is 🟡, append a brief entry to `design/decisions.md` listing the follow-ups so they don't get lost.

If verdict is 🔴, do NOT log — the change needs to come back through fix + re-review.

## What this skill MUST NOT do

- Modify code. Review only.
- Be vague ("might want to look at…"). Be concrete: file + line + which dimension.
- Pass a change with reds. Reds are blockers.
- Skip dimensions. All five run on every review.

## Verifying this skill worked

- Five dimensions checked, each with a verdict.
- Every red and yellow has file + line.
- Verdict logged (where appropriate).
- The user knows exactly what to fix next (if anything).
