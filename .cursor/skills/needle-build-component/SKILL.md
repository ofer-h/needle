---
name: needle-build-component
description: Build a new reusable component (primitive or feature) for Needle following the design-system conventions. Use when the user asks to add, extract, or create a Button, Chip, Icon, Pill, Checkbox, or any new React component. Enforces props typing, variant unions, full state coverage, semantic tokens, and design-doc updates.
---

# Needle — Build Component

Template skill for adding a new component. Enforces the full design-system contract before the component is considered done.

## When to use

Triggers:
- "Add a Button / Chip / Icon / Pill component"
- "Extract this into a reusable component"
- "Create a primitive for X"
- "Build the Empty State / Toast / Alert component"

## Process

### Step 1 — Classify the component

| Classification | Lives in | Examples |
|----------------|----------|----------|
| Primitive | `src/renderer/components/primitives/` | Button, Chip, Icon, Pill, Checkbox, Avatar |
| Domain | `src/renderer/components/<Domain>/` | TaskRow, EventRow, Section |
| Layout | `src/renderer/components/Window/` | FxWindow, Titlebar |

If it's used across more than one screen, it's a primitive. Otherwise it stays in its domain folder.

### Step 2 — Define the props contract

Write the `type Props = {…}` before writing the JSX. Cover:

- Required content (label, icon, children, etc.) — no defaults
- Variant union (`variant?: 'primary' | 'secondary' | 'ghost'`)
- Size scale (`size?: 'sm' | 'md' | 'lg'`)
- State flags only when truly orthogonal to variant (`disabled`, `loading`)
- Event handlers (`onClick`, `onToggle`)
- ARIA / accessibility props pass-through (`aria-label` when not visually labelled)

Show the type to the user. Confirm before implementing.

### Step 3 — Enumerate states

Every interactive component must visually handle:

| State | Default styling source |
|-------|------------------------|
| default | base tokens |
| hover | `--surface-hover` or token-shifted color |
| focus-visible | focus ring using `--border-strong` |
| active / pressed | `--surface-active` or scale-down |
| disabled | reduced contrast token + `pointer-events: none` |
| loading | spinner / skeleton, button disabled |

Non-interactive components only need default + (occasionally) emphasized.

### Step 4 — Identify token needs

List every token the component uses. If any token doesn't exist yet:
- Stop. Invoke `needle-add-token` first to add it properly.
- Resume here once tokens are in place.

Never inline a hex value in a new component. That's an automatic reject.

### Step 5 — Implement

File structure:

```tsx
import { ... } from 'react';

type Props = {
  // … see Step 2
};

export default function ComponentName({ ... }: Props) {
  // logic
  return ( /* JSX referencing only semantic tokens */ );
}
```

Conventions:
- Function components only. No `React.FC`.
- Named handlers (`handleClick`), not inline arrows in JSX when reused.
- Keys for lists are stable IDs, never indices for reorderable lists.
- Pass `aria-label` through when the component is not visually labeled.

### Step 6 — Update design docs

Update `design/components.md`. Add a new entry:

```md
### ComponentName

- Location: `src/renderer/components/primitives/ComponentName.tsx`
- Purpose: …
- Props: `variant`, `size`, `disabled`, …
- Variants: primary, secondary, ghost
- States: default, hover, focus, active, disabled
- Tokens used: --ink-primary, --surface-raised, --border-strong, --accent-urgent
- Status: ready
- Used by: TaskRow, EventRow, …
```

Log the addition in `design/decisions.md`.

### Step 7 — Story (when Ladle is installed)

Defer until Phase 3. Once Ladle is added, every new component ships with a `*.stories.tsx` covering all variants + states.

## What this skill MUST NOT do

- Introduce new tokens inline. Use `needle-add-token`.
- Add a story file before Ladle is set up. The pattern is documented; the tool isn't installed yet.
- Skip the props contract step. The type comes before the JSX.
- Build a "god component" with too many variants. If `variant` has > 4 values, the component is doing too much — split it.

## Anti-patterns this skill catches

| Bad | Why | Fix |
|-----|-----|-----|
| `isPrimary` and `isDanger` boolean flags | Variant unions are clearer | `variant: 'primary' \| 'danger'` |
| Component knows its parent layout | Cross-cutting concern | Parent positions; component is unaware |
| Mixing logic and presentation | Hard to test/reuse | Keep presentation pure; lift logic to caller |
| Children + label both for text content | Ambiguous API | Pick one and stick with it |
| Color hardcoded for one variant | Variants need their own tokens | Define `--btn-primary-bg`, `--btn-danger-bg`, etc. |

## Verifying this skill worked

- Component file is < 150 lines (split if larger)
- Zero raw hex in the file
- All states from Step 3 are handled
- `design/components.md` has the new entry
- Typecheck + lint pass
- Component is consumed by at least one place (don't add unused primitives)
