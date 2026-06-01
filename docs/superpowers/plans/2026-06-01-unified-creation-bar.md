# Unified Creation Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate "Add a task" input + "+ Event" button with a single unified bar that defaults to Task mode and switches to Event mode via a `/` shortcut or manual toggle.

**Architecture:** `InlineAdd` in `packages/ui-web` gains a `mode` state (`'task' | 'event'`), a segmented toggle, and an `onAddEvent` prop. The desktop app's `TodayBoardScreen` removes the standalone event button and passes the new prop. No new files needed — all changes are within the two existing files plus their CSS.

**Tech Stack:** React 18, TypeScript strict, CSS custom properties (semantic tokens only), Vitest

---

## File Map

| File | Change |
|---|---|
| `packages/ui-web/src/components/InlineAdd.tsx` | Add `mode` state, type toggle, `/` detection, `onAddEvent` prop, duration chip |
| `packages/ui-web/src/components/InlineAdd.css` | Add toggle, event-mode, and duration styles |
| `apps/desktop/src/renderer/components/Today/TodayBoardScreen.tsx` | Pass `onAddEvent`, remove `+ Event` button block |
| `apps/desktop/src/renderer/components/Today/TodayScreen.css` | Remove `.today-screen__event-add` / `__event-btn` styles |

---

## Task 1: Add `onAddEvent` prop and mode state to InlineAdd (no UI yet)

**Files:**
- Modify: `packages/ui-web/src/components/InlineAdd.tsx`

- [ ] **Step 1: Add the new prop type and `mode` state**

Replace the top of `InlineAdd.tsx` (imports + type + component signature) with:

```tsx
import { useRef, useState, type KeyboardEvent } from 'react';
import { parseQuickAdd, type ItemId, type NewEventInput, type NewItemInput } from '../model';
import { Icon } from '../primitives';
import './InlineAdd.css';

type InlineAddProps = {
  onAdd: (input: NewItemInput) => ItemId;
  onAddEvent: (input: NewEventInput) => void;
  onAddChild: (parentId: ItemId, title: string) => void;
  onPullYesterday?: () => void;
  hasYesterday?: boolean;
};

export function InlineAdd({ onAdd, onAddEvent, onAddChild, onPullYesterday, hasYesterday }: InlineAddProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'task' | 'event'>('task');
  const [ai, setAi] = useState(false);
  const [nestMode, setNestMode] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [durationOpen, setDurationOpen] = useState(false);
  const lastId = useRef<ItemId | null>(null);
  const lastTitle = useRef<string>('');
```

- [ ] **Step 2: Add `switchMode` helper and update `submit()`**

Replace the existing `submit` function with:

```tsx
  const switchMode = (next: 'task' | 'event') => {
    setMode(next);
    setText('');
    setTime('');
    setDuration('');
    setTimeOpen(false);
    setDurationOpen(false);
    setNestMode(false);
  };

  const submit = () => {
    const raw = text.trim();

    if (mode === 'event') {
      if (!raw || !time) return;
      const durationMinutes = parseDurationMinutes(duration);
      const endTime = durationMinutes > 0 ? addMinutesToTime(time, durationMinutes) : undefined;
      onAddEvent({ title: raw, startTime: time, ...(endTime !== undefined && { endTime }) });
      setText('');
      setTime('');
      setDuration('');
      setTimeOpen(false);
      setDurationOpen(false);
      return;
    }

    if (!raw) return;

    if (nestMode && lastId.current) {
      onAddChild(lastId.current, raw);
      setText('');
      return;
    }

    let input: NewItemInput;
    if (ai) {
      const parsed = parseQuickAdd(raw);
      input = parsed.input;
    } else {
      input = { title: raw };
    }
    if (time && !input.startTime) input.startTime = time;

    const newId = onAdd(input);
    lastId.current = newId;
    lastTitle.current = input.title;
    setText('');
  };
```

- [ ] **Step 3: Add the two pure time-helper functions** (above the component, after imports)

```tsx
/** Parse "30m", "1h", "1h30m", "90m" → minutes. Returns 0 if unparseable. */
function parseDurationMinutes(raw: string): number {
  const s = raw.trim().toLowerCase();
  const hoursOnly = /^(\d+)h$/.exec(s);
  if (hoursOnly) return parseInt(hoursOnly[1] ?? '0', 10) * 60;
  const minsOnly = /^(\d+)m$/.exec(s);
  if (minsOnly) return parseInt(minsOnly[1] ?? '0', 10);
  const combined = /^(\d+)h(\d+)m$/.exec(s);
  if (combined) return parseInt(combined[1] ?? '0', 10) * 60 + parseInt(combined[2] ?? '0', 10);
  return 0;
}

/** Add minutes to a "HH:MM" string, returns "HH:MM". */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hStr, mStr] = timeStr.split(':');
  const totalMinutes = parseInt(hStr ?? '0', 10) * 60 + parseInt(mStr ?? '0', 10) + minutes;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
```

- [ ] **Step 4: Update `onKey` to handle `/` trigger and Enter in event mode**

Replace the existing `onKey`:

```tsx
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submit();
    } else if (e.key === 'Tab' && mode === 'task') {
      e.preventDefault();
      if (lastId.current) setNestMode((v) => !v);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '/' && mode === 'task') {
      switchMode('event');
      return;
    }
    setText(val);
  };
```

- [ ] **Step 5: Wire `onChange` to `handleTextChange` in the input**

In the JSX, change `onChange={(e) => setText(e.target.value)}` to `onChange={handleTextChange}`.

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @needle/ui-web typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/ui-web/src/components/InlineAdd.tsx
git commit -m "feat(ui-web): add onAddEvent prop + mode state + / trigger to InlineAdd (no UI yet)"
```

---

## Task 2: Add the segmented toggle and event-mode chips to the JSX

**Files:**
- Modify: `packages/ui-web/src/components/InlineAdd.tsx`

- [ ] **Step 1: Replace the spark button with the type toggle**

Replace the existing spark `<button>` block:

```tsx
        <button
          type="button"
          className={`inline-add__spark${ai ? ' inline-add__spark--on' : ''}`}
          onClick={() => setAi((v) => !v)}
          aria-pressed={ai}
          aria-label="Toggle AI parsing"
          title={ai ? 'AI parsing on — detects time, duration, kind' : 'Plain add'}
        >
          <Icon name={ai ? 'spark' : 'plus'} size={15} tone={ai ? 'upcoming' : 'muted'} />
        </button>
```

with:

```tsx
        <div className="inline-add__type-toggle" role="group" aria-label="Item type">
          <button
            type="button"
            className={`inline-add__type-btn${mode === 'task' ? ' inline-add__type-btn--task' : ''}`}
            onClick={() => switchMode('task')}
            aria-pressed={mode === 'task'}
          >
            Task
          </button>
          <button
            type="button"
            className={`inline-add__type-btn${mode === 'event' ? ' inline-add__type-btn--event' : ''}`}
            onClick={() => switchMode('event')}
            aria-pressed={mode === 'event'}
          >
            Event
          </button>
        </div>
```

- [ ] **Step 2: Update the input placeholder**

Change the `placeholder` prop on the `<input>` to:

```tsx
          placeholder={
            mode === 'event'
              ? 'Event name…'
              : nestMode
                ? 'Add a subtask…'
                : 'Add a task…'
          }
```

- [ ] **Step 3: Update the chips section**

Replace the entire `.inline-add__chips` div with:

```tsx
        <div className="inline-add__chips">
          {mode === 'task' && lastId.current && (
            <button
              type="button"
              className={`inline-add__chip inline-add__nest-toggle${nestMode ? ' inline-add__chip--on' : ''}`}
              onClick={toggleNest}
              aria-pressed={nestMode}
              aria-label={nestMode ? 'Cancel nest mode — add to top level' : 'Nest next item under last added'}
              title={nestMode ? 'Click to add at top level instead' : 'Nest under last added item'}
            >
              <Icon name="chevron-right" size={12} tone={nestMode ? 'upcoming' : 'muted'} rotate={90} />
            </button>
          )}
          <button
            type="button"
            className={`inline-add__chip${timeOpen || time ? ' inline-add__chip--on' : ''}${mode === 'event' ? ' inline-add__chip--event' : ''}`}
            onClick={() => setTimeOpen((v) => !v)}
            aria-label="Set a time"
          >
            <Icon name="clock" size={13} tone={time ? (mode === 'event' ? 'urgent' : 'upcoming') : 'muted'} />
            {time || 'time'}
          </button>
          {timeOpen && (
            <input
              type="time"
              className="inline-add__time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Time"
            />
          )}
          {mode === 'event' && (
            <>
              <button
                type="button"
                className={`inline-add__chip${durationOpen || duration ? ' inline-add__chip--on' : ''} inline-add__chip--event`}
                onClick={() => setDurationOpen((v) => !v)}
                aria-label="Set duration"
              >
                <Icon name="clock" size={13} tone={duration ? 'urgent' : 'muted'} />
                {duration || 'duration'}
              </button>
              {durationOpen && (
                <input
                  type="text"
                  className="inline-add__duration"
                  value={duration}
                  placeholder="30m"
                  onChange={(e) => setDuration(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDurationOpen(false); } }}
                  aria-label="Duration (e.g. 30m, 1h, 1h30m)"
                />
              )}
            </>
          )}
          <button
            type="button"
            className="inline-add__submit"
            onClick={submit}
            disabled={mode === 'event' ? (!text.trim() || !time) : !text.trim()}
          >
            Add
          </button>
        </div>
```

- [ ] **Step 4: Update the root className**

Change the root `<div>` className to also carry the mode modifier:

```tsx
    <div className={`inline-add inline-add--${mode}${nestMode ? ' inline-add--nest' : ''}`}>
```

Remove the `${ai ? ' inline-add--ai' : ''}` part since the AI spark button is gone.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @needle/ui-web typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/ui-web/src/components/InlineAdd.tsx
git commit -m "feat(ui-web): render type toggle + event chips in InlineAdd JSX"
```

---

## Task 3: Style the toggle and event mode in CSS

**Files:**
- Modify: `packages/ui-web/src/components/InlineAdd.css`

- [ ] **Step 1: Remove the AI-spark styles and add toggle + event styles**

At the top of the file, remove the `.inline-add--ai` block:

```css
.inline-add--ai .inline-add__main {
  border-color: var(--upcoming);
}
```

Remove the `.inline-add__spark` and `.inline-add__spark--on` blocks entirely.

- [ ] **Step 2: Add all new styles** at the end of the file:

```css
/* ── Type toggle ─────────────────────────────────────────────────────── */
.inline-add__type-toggle {
  display: inline-flex;
  background: var(--surface-sub);
  border-radius: var(--radius-2);
  padding: 3px;
  gap: 2px;
  flex-shrink: 0;
}

.inline-add__type-btn {
  padding: 4px 10px;
  border-radius: calc(var(--radius-2) - 2px);
  font-size: var(--text-12);
  font-weight: 500;
  font-family: inherit;
  color: var(--ink-3);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.inline-add__type-btn--task {
  background: var(--surface);
  color: var(--upcoming);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--ink) 10%, transparent);
}

.inline-add__type-btn--event {
  background: var(--surface);
  color: var(--urgent);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--ink) 10%, transparent);
}

/* ── Event mode border accent ────────────────────────────────────────── */
.inline-add--event .inline-add__main {
  border-color: var(--urgent-soft);
}

/* Override task-mode border (nest) when in task mode */
.inline-add--task.inline-add--nest .inline-add__main {
  border-color: var(--upcoming);
  border-left-width: 3px;
}

/* ── Event-toned chips ───────────────────────────────────────────────── */
.inline-add__chip--event {
  color: var(--urgent);
  background: var(--urgent-soft);
}

/* ── Duration inline input ───────────────────────────────────────────── */
.inline-add__duration {
  width: 68px;
  height: 28px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-2);
  background: var(--surface);
  color: var(--ink);
  font-size: var(--text-12);
  padding: 0 6px;
  font-family: inherit;
}

@media (prefers-reduced-motion: reduce) {
  .inline-add__type-btn {
    transition: none;
  }
}
```

- [ ] **Step 3: Visually verify in Studio**

```bash
pnpm --filter @needle/studio dev
```

Open the Studio in a browser. Check:
- Default bar shows Task/Event toggle with Task active (green tint)
- Clicking Event switches toggle and border color shifts warm
- Duration chip appears only in Event mode

- [ ] **Step 4: Commit**

```bash
git add packages/ui-web/src/components/InlineAdd.css
git commit -m "feat(ui-web): style type toggle + event mode in InlineAdd"
```

---

## Task 4: Wire up in TodayBoardScreen + remove old event button

**Files:**
- Modify: `apps/desktop/src/renderer/components/Today/TodayBoardScreen.tsx`
- Modify: `apps/desktop/src/renderer/components/Today/TodayScreen.css`

- [ ] **Step 1: Add `onAddEvent` handler in TodayBoardScreen**

In `TodayBoardScreen.tsx`, add `addEvent` to the imports from `@needle/ui-web`:

```tsx
import {
  addChild,
  addEvent,       // ← add this
  addItem,
  buildTodayView,
  BUILTIN_TEMPLATES,
  Countdown,
  InlineAdd,
  ProgressBar,
  pullYesterdayUnfinished,
  TodayBoard,
  type ItemId,
  type NewEventInput,  // ← add this
  type NewItemInput,
  type Template,
  type TemplateId,
  type TodayData,
} from '@needle/ui-web';
```

- [ ] **Step 2: Add the `handleAddEvent` handler** (after `handleAdd`):

```tsx
  const handleAddEvent = (input: NewEventInput): void => {
    const result = addEvent(data, input, now);
    onChange(result.data);
  };
```

- [ ] **Step 3: Pass `onAddEvent` to `InlineAdd` and remove the event button block**

Replace:

```tsx
      <InlineAdd
        onAdd={handleAdd}
        onAddChild={(parentId, title) => onChange(addChild(data, parentId, title))}
        onPullYesterday={() => onChange(pullYesterdayUnfinished(data, now))}
        hasYesterday={hasYesterday}
      />

      <div className="today-screen__event-add">
        <button
          type="button"
          className="today-screen__event-btn"
          onClick={() => setEventModalOpen(true)}
        >
          + Event
        </button>
      </div>
```

with:

```tsx
      <InlineAdd
        onAdd={handleAdd}
        onAddEvent={handleAddEvent}
        onAddChild={(parentId, title) => onChange(addChild(data, parentId, title))}
        onPullYesterday={() => onChange(pullYesterdayUnfinished(data, now))}
        hasYesterday={hasYesterday}
      />
```

- [ ] **Step 4: Remove the `eventModalOpen` state and `EventEditorModal`** since the button that triggers it is gone:

Remove:

```tsx
  const [eventModalOpen, setEventModalOpen] = useState(false);
```

Remove from the JSX:

```tsx
      {eventModalOpen && (
        <EventEditorModal
          data={data}
          now={now}
          onChange={onChange}
          onClose={() => setEventModalOpen(false)}
        />
      )}
```

Remove the import of `EventEditorModal`.

- [ ] **Step 5: Remove the orphaned CSS in TodayScreen.css**

In `apps/desktop/src/renderer/components/Today/TodayScreen.css`, delete the event button block:

```css
.today-screen__event-add {
  ...
}

.today-screen__event-btn {
  ...
}

.today-screen__event-btn:hover {
  ...
}

.today-screen__event-btn:focus-visible {
  ...
}
```

- [ ] **Step 6: Typecheck the full workspace**

```bash
pnpm --filter @needle/desktop typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src/renderer/components/Today/TodayBoardScreen.tsx \
        apps/desktop/src/renderer/components/Today/TodayScreen.css
git commit -m "feat(desktop): wire InlineAdd onAddEvent + remove standalone event button"
```

---

## Task 5: Tests for the two pure helper functions

**Files:**
- Create: `packages/ui-web/src/components/InlineAdd.test.ts`

- [ ] **Step 1: Create the test file**

```ts
import { describe, it, expect } from 'vitest';

// Exported only for testing — keep export minimal
import { parseDurationMinutes, addMinutesToTime } from './InlineAdd';
```

Wait — the helpers are module-private functions. Export them with a `/* @internal */` comment so tests can reach them. In `InlineAdd.tsx`, change:

```tsx
function parseDurationMinutes(raw: string): number {
```

to:

```tsx
/** @internal — exported for unit tests only */
export function parseDurationMinutes(raw: string): number {
```

And:

```tsx
function addMinutesToTime(timeStr: string, minutes: number): string {
```

to:

```tsx
/** @internal — exported for unit tests only */
export function addMinutesToTime(timeStr: string, minutes: number): string {
```

- [ ] **Step 2: Write the tests**

```ts
import { describe, it, expect } from 'vitest';
import { parseDurationMinutes, addMinutesToTime } from './InlineAdd';

describe('parseDurationMinutes', () => {
  it('parses "30m"', () => expect(parseDurationMinutes('30m')).toBe(30));
  it('parses "1h"', () => expect(parseDurationMinutes('1h')).toBe(60));
  it('parses "1h30m"', () => expect(parseDurationMinutes('1h30m')).toBe(90));
  it('parses "90m"', () => expect(parseDurationMinutes('90m')).toBe(90));
  it('returns 0 for empty string', () => expect(parseDurationMinutes('')).toBe(0));
  it('returns 0 for garbage', () => expect(parseDurationMinutes('abc')).toBe(0));
  it('is case-insensitive', () => expect(parseDurationMinutes('2H')).toBe(120));
});

describe('addMinutesToTime', () => {
  it('adds 30m to 14:00', () => expect(addMinutesToTime('14:00', 30)).toBe('14:30'));
  it('rolls over midnight', () => expect(addMinutesToTime('23:45', 30)).toBe('00:15'));
  it('adds 90m to 10:00', () => expect(addMinutesToTime('10:00', 90)).toBe('11:30'));
  it('handles 0 minutes', () => expect(addMinutesToTime('09:00', 0)).toBe('09:00'));
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @needle/ui-web test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/ui-web/src/components/InlineAdd.tsx \
        packages/ui-web/src/components/InlineAdd.test.ts
git commit -m "test(ui-web): unit tests for InlineAdd duration/time helpers"
```

---

## Task 6: Push

- [ ] **Step 1: Final typecheck + test**

```bash
pnpm typecheck && pnpm --filter @needle/ui-web test
```

Expected: zero errors, all tests green.

- [ ] **Step 2: Push**

```bash
git push origin master
```
