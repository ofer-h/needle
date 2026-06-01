# Unified Creation Bar

**Date:** 2026-06-01  
**Status:** Approved for implementation

## Goal

Replace the separate "Add a task…" input + "+ Event" button with a single, unified creation bar that handles both tasks and events naturally. Default mode is Task; typing `/` as the first character auto-switches to Event mode.

---

## Interaction Model

### Default — Task mode
- Bar shows `[Task | Event]` segmented toggle on the left, set to **Task**
- Placeholder: `Add a task…`
- Right-side chips: `🕐 time`
- Border accent: task green (`--upcoming` / `--upcoming-soft`)
- Pressing Enter / clicking **Add** → `onAdd(NewItemInput)`

### Switching to Event mode

Two ways:
1. **`/` shortcut:** Typing `/` as the very first character (empty input) instantly switches to Event mode. The `/` is consumed — input is cleared and focused, ready for the event name.
2. **Manual toggle:** Clicking "Event" in the segmented toggle switches mode.

In both cases: input is cleared, placeholder changes, chips update, border color shifts.

### Event mode
- Toggle set to **Event**
- Placeholder: `Event name…`
- Right-side chips: `🕐 time` + `⏱ duration` (both inline — see below)
- Border accent: event warm (`--event` / `--event-soft`, i.e. the existing `var(--urgent-soft)` / amber tones)
- Pressing Enter / clicking **Add** → `onAddEvent(NewEventInput)`  
  - **Add button is disabled** until both `title` and `startTime` are non-empty
  - `endTime` is derived: `startTime + duration` (defaults to +30 min if duration unset)

### Inline chip expansion

Clicking the `🕐 time` chip reveals a `<input type="time">` inline in the chips area (replaces chip). Clicking `⏱ duration` reveals a short text input (e.g. `30m`, `1h`, `1h30m`) inline. Clicking the expanded input again or pressing Escape collapses it back to chip form, keeping any entered value.

### Switching back to Task mode
Clicking "Task" in the toggle resets: clears input, hides duration chip, resets chips.

### What stays
- Nest mode (Tab / ↳ toggle) stays, Task mode only — hidden in Event mode.
- "Pull yesterday's unfinished" strip stays, Task mode only.
- The separate `EventEditorModal` (for travel prep) remains accessible via a small "More options →" link shown in Event mode after Add is clicked — or removed for now (travel prep is out of scope for this change).

---

## Component Changes

### `packages/ui-web/src/components/InlineAdd.tsx`
- Add `onAddEvent: (input: NewEventInput) => void` prop
- Add `mode: 'task' | 'event'` state (default `'task'`)
- Add `duration: string` state (default `''`)
- Add `durationOpen: boolean` state
- `onChange` handler: if `e.target.value === '/'` and mode is `'task'` → `setMode('event')`, `setText('')`
- Segmented toggle renders as two `<button>` elements inside a `.inline-add__type-toggle` wrapper
- Duration chip only rendered when `mode === 'event'`
- Nest toggle only rendered when `mode === 'task'`
- `submit()`: if `mode === 'event'` → build `NewEventInput` (title, startTime, endTime from duration) and call `onAddEvent`; else existing task path

### `packages/ui-web/src/components/InlineAdd.css`
- `.inline-add__type-toggle` — segmented pill container
- `.inline-add__type-btn` — individual task/event button, with `--on-task` and `--on-event` modifier classes
- `.inline-add--event .inline-add__main` — border-color shifts to `var(--event)` (reuse `--urgent` token or add `--event` alias)
- `.inline-add__duration` — inline duration input (same style as existing `__time`)

### `apps/desktop/src/renderer/components/Today/TodayBoardScreen.tsx`
- Pass `onAddEvent` to `InlineAdd` — handler wraps `addEvent(data, input, now)`
- Remove the `<div className="today-screen__event-add">` / `+ Event` button block
- Keep `EventEditorModal` import (travel prep path, can be triggered later)

---

## Token Notes

The warm/event color for Event mode needs a consistent token. The codebase uses `--urgent` (red-orange) for urgency. We should use `--upcoming` tones for task (already done) and introduce **`--event`** as an alias pointing to a warm amber:
- If a semantic `--event` token doesn't exist yet, use `var(--urgent-soft)` / `var(--urgent)` for now and note it as a future token.

---

## Out of Scope
- Travel prep flow (still accessible via full `EventEditorModal` elsewhere)
- AI parsing (existing `✨` toggle remains, unrelated to this change)
- Recurring events
