# Components

Current inventory of Needle's React components. Updated by `needle-ui-audit` and `needle-build-component` whenever the surface changes.

## Status legend

| Status | Meaning |
|--------|---------|
| `mvp` | Built, but has discipline violations (raw hex, inline styles, missing variants) |
| `tokenized` | Uses semantic tokens correctly but isn't yet a reusable primitive |
| `primitive` | Reusable design-system primitive in `components/primitives/` |
| `ready` | Primitive + has Ladle story + states fully handled |
| `planned` | In PRD, not yet implemented |

## Primitives (`src/renderer/components/primitives/`)

### Icon

- Location: `primitives/Icon/Icon.tsx`
- Purpose: Canonical icon wrapper. Maps semantic tone tokens to colour; never accepts raw hex.
- Props: `name`, `size`, `tone` (default / muted / inherit / urgent / upcoming / calendar), `rotate`, `label`, `className`, `style`
- States: tone variants × rotate
- Tokens: `--icon-default`, `--icon-muted`, `--urgent`, `--upcoming`, `--calendar`
- Status: **primitive**
- Used by: TaskRow, EventRow, TodayToolbar, QuickAddRow, UpcomingFooter, CaptureFab, OverlayRow (via Checkbox)

### Kbd

- Location: `primitives/Kbd/Kbd.tsx`
- Purpose: Keyboard shortcut hint chip
- Props: `children`, `size` (sm / md), `ghost`
- States: sized × ghost vs surface
- Tokens: `--mono`, `--ink-2`, `--ink-3`, `--surface-sub`, `--radius-1`
- Status: **primitive**
- Used by: TodayToolbar, QuickAddRow, CaptureFab

### Divider

- Location: `primitives/Divider/Divider.tsx`
- Purpose: Hairline / dotted separator (horizontal or vertical)
- Props: `orientation`, `variant` (subtle / strong / dotted), `inset`, `decorative`
- Tokens: `--hairline`, `--hairline-2`
- Status: **primitive**
- Used by: UpcomingFooter

### ProgressBar

- Location: `primitives/ProgressBar/ProgressBar.tsx`
- Purpose: Linear progress indicator with semantic tone
- Props: `value`, `max`, `label`, `width`, `tone` (default / urgent / upcoming)
- A11y: `role="progressbar"` + `aria-valuemin/max/now` + optional label
- Tokens: `--surface-sub`, `--ink-2`, `--urgent`, `--upcoming`
- Status: **primitive**
- Used by: TodayToolbar

### Pill

- Location: `primitives/Pill/Pill.tsx`
- Purpose: Small inline tag for dates, times, counts, status
- Props: `children`, `variant` (neutral / urgent / upcoming / outline), `size` (sm / md), `leading`, `tabular`
- Tokens: `--surface-sub`, `--ink-2`, `--urgent`, `--urgent-soft`, `--upcoming`, `--upcoming-soft`, `--hairline-2`
- Status: **primitive**
- Used by: TaskRow, EventRow, UpcomingFooter, OverlayRow

### Checkbox

- Location: `primitives/Checkbox/Checkbox.tsx`
- Purpose: Circular task checkbox; tone reflects priority, checked fills with `upcoming`
- Props: `checked`, `onToggle`, `tone` (neutral / urgent / upcoming), `label` (required), `disabled`
- States: default, checked, urgent glow, disabled, focus-visible
- Tokens: `--ink-3`, `--urgent`, `--upcoming`, `--border-strong`, `--ink-disabled`
- Status: **primitive**
- Used by: TaskRow, OverlayRow

### Button

- Location: `primitives/Button/Button.tsx`
- Purpose: Text button (with optional leading icon + trailing)
- Props: `children`, `variant` (primary / subtle / ghost), `size` (sm / md / lg), `leadingIcon`, `trailing`, `block`, + standard `ButtonHTMLAttributes`
- States: default, hover, active, disabled, focus-visible
- Tokens: `--ink`, `--ink-2`, `--ink-3`, `--bg`, `--surface-sub`, `--surface-active`, `--border-strong`, `--ink-disabled`, `--surface-disabled`
- Status: **primitive**

### IconButton

- Location: `primitives/IconButton/IconButton.tsx`
- Purpose: Icon-only trigger. Always requires accessible `label`.
- Props: `children`, `label` (required), `variant` (ghost / subtle), `size` (sm / md), `hoverReveal`, ref-forwarded button props
- A11y: aria-label enforced
- States: default, hover, active, disabled, focus-visible, hover-reveal (via `.ds-hover-reveal` ancestor)
- Tokens: `--icon-default`, `--surface-sub`, `--surface-active`, `--ink`, `--ink-disabled`, `--border-strong`
- Status: **primitive**
- Used by: TaskRow (drag handle)

## Window

### FxWindow

- Location: `src/renderer/components/Window/FxWindow.tsx`
- Purpose: Top-level window frame (titlebar + body)
- Props: `title?: string`, `children: ReactNode`
- States: default only (passive container)
- Status: **mvp**
- Used by: `TodayScreen`, `CaptureScreen`

### Titlebar

- Location: `src/renderer/components/Window/Titlebar.tsx`
- Purpose: macOS-style titlebar with centered title; traffic lights drawn natively by Electron
- Props: `title?: string`
- States: default only
- Status: **mvp**
- Notes: Already follows native macOS conventions (per `design-macos.mdc`)

## Today screen

### TodayScreen

- Location: `src/renderer/components/Today/TodayScreen.tsx`
- Purpose: Today's timeline (events + tasks), DnD reordering, overdue section, upcoming footer. Pure orchestration — all sub-areas are extracted.
- Composes: `FxWindow`, `TodayToolbar`, `Section`, `TaskRow`, `EventRow`, `GapDropZone`, `OverlayRow`, `QuickAddRow`, `UpcomingFooter`, `CaptureFab`
- Status: **tokenized** — no inline-style blocks left, semantic tokens only

### TodayToolbar

- Location: `src/renderer/components/Today/TodayToolbar.tsx`
- Purpose: Title + date/count meta + progress bar + "Add task" CTA
- Props: `dateLabel`, `total`, `doneCount`, `onAddTask`
- Composes: `ProgressBar`, `Icon`, `Kbd`
- Status: **tokenized**

### QuickAddRow

- Location: `src/renderer/components/Today/QuickAddRow.tsx`
- Purpose: Inline row prompting capture; full keyboard activation (Enter / Space)
- Props: `onActivate`
- A11y: `role="button"` + `tabIndex={0}` + `onKeyDown` + `aria-label` + `:focus-visible`
- Composes: `Icon`, `Kbd`
- Status: **tokenized**

### UpcomingFooter

- Location: `src/renderer/components/Today/UpcomingFooter.tsx`
- Purpose: Collapsible footer listing upcoming tasks; dividers + count + chevron
- Props: `items`, `expanded`, `onToggle`
- A11y: `aria-expanded`, `aria-controls`, `aria-label`
- Composes: `Divider`, `Icon`, `Pill`
- Status: **tokenized** — `items` still placeholder data; gap vs PRD

### CaptureFab

- Location: `src/renderer/components/Today/CaptureFab.tsx`
- Purpose: Floating action button → capture composer (⌘ K)
- Props: `onClick`
- A11y: `aria-label`, `aria-keyshortcuts`
- Composes: `Icon`, `Kbd`
- Status: **tokenized**

### ItemRow

- Location: `src/renderer/components/Today/ItemRow.tsx`
- Purpose: Unified row implementation for timeline items (`kind: task | event`). Tasks render completion + optional drag affordance; events render calendar source + time pill and remain non-checkable.
- Props: task variant: `id`, `scheduleKind`, `priority`, `label`, `date`, `sublabel?`, `link?`, `datePill?`, `done?`, `onToggle?`; event variant: `label`, `startTime`, `sublabel?`
- Composes: `Checkbox`, `Icon`, `IconButton`, `Pill`, `ItemDetail`, `ItemMenu`
- States: default, hover, focus-visible, expanded, done for tasks, flexible drag wrapper/ghost state, event default. Checkbox and IconButton bring focus states.
- Tokens: `--ink`, `--ink-2`, `--ink-3`, `--ink-4`, `--urgent`, `--upcoming`, `--calendar`, `--surface-sub`, `--hairline-2`, `--border-strong`, `--icon-muted`
- Status: **tokenized** — shared implementation with inline expansion and anchored menu for tasks
- Used by: `TaskRow`, `EventRow`

### ItemDetail

- Location: `src/renderer/components/Today/ItemDetail.tsx`
- Purpose: Inline expanded task detail region with original input, AI reason, notes, subtasks, and quick actions.
- Props: `id`, `taskId`, `labelledBy`
- Composes: `Button`, `SubtaskList`
- States: visible when the task is expanded; notes textarea focus-visible; actions inherit Button states
- Tokens: `--ink`, `--ink-2`, `--ink-3`, `--ink-4`, `--bg`, `--hairline-2`, `--border-strong`
- Status: **tokenized**

### SubtaskList

- Location: `src/renderer/components/Today/SubtaskList.tsx`
- Purpose: Flat subtask checklist with inline add, check, and delete.
- Props: `taskId`, `subtasks`
- Composes: `Checkbox`, `IconButton`
- States: empty, populated, checked, disabled add button, focus-visible input/button
- Tokens: `--ink`, `--ink-2`, `--ink-3`, `--ink-4`, `--bg`, `--surface-sub`, `--surface-active`, `--surface-disabled`, `--ink-disabled`, `--hairline-2`, `--border-strong`
- Status: **tokenized**

### ItemMenu

- Location: `src/renderer/components/Today/ItemMenu.tsx`
- Purpose: Anchored task action menu using `@floating-ui/react`.
- Props: `taskId`
- Composes: `IconButton`
- States: closed, open, hover/focus menu item, danger item
- Tokens: `--surface`, `--surface-sub`, `--ink`, `--ink-2`, `--urgent`, `--hairline-2`, `--border-strong`, `--shadow-card`
- Status: **tokenized**

### TaskRow

- Location: `src/renderer/components/Today/TaskRow.tsx`
- Purpose: Compatibility wrapper for task rows. Adapts the existing `TaskRow` API to `ItemRow`.
- Props: `id`, `scheduleKind`, `kind` (urgent / upcoming / faded), `label`, `sublabel?`, `date`, `link?`, `datePill?`, `done?`, `onToggle?`
- Composes: `ItemRow`
- States: inherited from `ItemRow`
- Tokens: inherited from `ItemRow`
- Status: **tokenized** — compatibility wrapper
- Used by: TodayScreen

### EventRow

- Location: `src/renderer/components/Today/EventRow.tsx`
- Purpose: Compatibility wrapper for calendar event rows. Adapts the existing `EventRow` API to `ItemRow`.
- Props: `startTime`, `label`, `sublabel?`
- Composes: `ItemRow`
- States: inherited from `ItemRow`
- Tokens: inherited from `ItemRow`
- Status: **tokenized** — compatibility wrapper

### Section

- Location: `src/renderer/components/Today/Section.tsx`
- Purpose: Section header (title + date + count) above a list of rows
- Props: `title`, `date?`, `count?`, `accent?`, `children`
- States: default only
- Status: **tokenized**

### GapDropZone (DnD artefact)

- Location: `src/renderer/components/Today/dnd/GapDropZone.tsx`
- Purpose: Drop pocket between consecutive timeline items
- Props: `id`, `disabled?`
- Status: **tokenized**

### OverlayRow (DnD artefact)

- Location: `src/renderer/components/Today/dnd/OverlayRow.tsx`
- Purpose: Pure display clone rendered inside `<DragOverlay>` — no DnD hooks
- Composes: `Checkbox`, `Pill`
- Status: **tokenized**

## Capture screen

### CaptureScreen

- Location: `src/renderer/components/Capture/CaptureScreen.tsx`
- Purpose: Four-state capture flow (empty / typing / classified / voice)
- Status: **mvp** — heavy inline styles; out of scope of current refactor

## Icons (glyph source)

### Icons.tsx

- Location: `src/renderer/components/Icons.tsx`
- Exports: `IconArrow`, `IconChevron`, `IconBack`, `IconCal`, `IconMic`, `IconPaperclip`, `IconCheck`, `IconThumbsUp`, `IconThumbsDown`, `IconSpark`, `IconPlus`, `IconCommand`
- Props: `size?: number`
- Status: **internal** — consumed only by `primitives/Icon`. Direct import banned in new code; existing Capture imports stay until Capture refactor.

## Missing primitives (planned — out of Today scope)

| Primitive | Currently inlined in | Notes |
|-----------|---------------------|-------|
| `Chip` | Defined as `.chip` CSS but no React wrapper | Has variants: default, outline, urgent, upcoming, gold (Capture uses) |
| `EmptyState` | Not built | PRD shows empty states for Today and Capture |
| `Toast` | Not built | PRD-implied for capture confirmation |

## Coverage gaps vs PRD

Read `PRD.md` against this inventory. Anything in PRD that's not in this doc with status `tokenized`, `primitive`, or `ready` is a gap.

### Today screen functional gaps (still pending)

| PRD requirement | State |
|---|---|
| Empty state ("Nothing due today. Rare and good…") | **missing** |
| Inline item expansion (original input + AI reasoning + Reschedule / Remember / Delete + 👍/👎) | **missing** — biggest functional gap |
| Completion animation (warm fill sweep, dissolve up, counter bounce) | **missing** |
| "NOW" / "COMING UP" serif eyebrow section labels | **missing** — currently plain sans labels |
| Top counter "3 done today ✦" with sparkle + bounce | partial — text only, no sparkle, no bounce |
| Single persistent floating + button as the only nav element | **violated** — three add-task affordances exist (toolbar CTA + quick-add + FAB) |
| Upcoming overflow uses real store data | **missing** — uses `UPCOMING_PLACEHOLDER` |
| Reschedule chip row on expansion | **missing** |
| Keyboard reorder for flexible tasks (DnD KeyboardSensor) | **missing** |

These are out of scope for the 2026-05-26 refactor (which focused on token discipline + primitive extraction). They land in future feature work.
