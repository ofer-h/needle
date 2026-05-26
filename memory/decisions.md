# Decision Log

Append a new entry here at the end of every session.
Format: `### YYYY-MM-DD — <topic> (<who made the call>)`

---

### 2026-05-24 — Project scaffold (Ofer)
- Stack: Electron 42 + Forge + Vite + React + TypeScript. Zustand for state. Global CSS + custom properties (no Tailwind).
- Design faithfully ported from `/Users/groot/Downloads/Needle/` hi-fi JSX/CSS files.
- Two screens: Today and Capture (4 states). All data is mock — no AI or DB yet.
- Deferred to later: AI (Anthropic API), SQLite, calendar (EventKit), widget, notifications.

### 2026-05-24 — Vite build fix (AI recommendation, Ofer approved)
- Both `src/main/index.ts` and `src/preload/index.ts` both produced `index.js` → overwrote each other.
- Fix: explicit `lib.fileName` in each vite config → `main.js` / `preload.js` in `.vite/build/`.
- `package.json` main updated to `.vite/build/main.js`.

### 2026-05-24 — Gap-based drag-and-drop (AI recommendation, Ofer approved)
- Replaced `SortableContext` + `useSortable` (element-swap pattern) with gap drop zones + `useDraggable` (insert-between pattern).
- Each gap between timeline items is a `useDroppable` zone with ID `gap-{section}-{n}`; dropping into it inserts at that slot position rather than swapping items.
- `DragOverlay` renders a floating clone; original item goes `opacity: 0` during drag.
- Fixed tasks and calendar events are never draggable; gap zones around them still accept drops.
- Activation constraint: `distance: 5px` on PointerSensor prevents checkbox clicks triggering drag.
- Removed `.t-row + .t-row { margin-top: -1px }` CSS rule — gap zones now own inter-row spacing.

### 2026-05-26 — Task scheduling redesign (Omri directed, Ofer implemented)
- Discussed and planned architecture before implementing (plan file: `task_scheduling_architecture_74b9dc06`).
- Two scheduling kinds: `fixed` (time-anchored, immovable) and `flexible` (no fixed hour, freely reorderable).
- Single interleaved timeline: fixed anchors divide the day into slots; flexible tasks live inside slots.
- `slotIndex` (which slot) + `slotOrder` (position within slot, fractional indexing) on each flexible task.
- Replaced `CalendarEvent.time` (display string) with `startTime: 'HH:MM'` for actual sort ordering.
- Added `isOverdue?: boolean` to `Task` for explicit overdue flagging.
- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (`--legacy-peer-deps` due to pre-existing eslint peer conflict).
- Today screen scope: only `timeSlot === 'today'` visible; Tomorrow/This Week removed; collapsed "Upcoming · 5" footer at bottom.
- Overdue section above the timeline with its own independent DndContext.

### 2026-05-26 — DnD approach: gap zones not SortableContext (AI recommendation, Ofer approved)
- First attempt used `SortableContext` + `useSortable` → element-swap, not insert. Scrapped.
- Final approach: `useDroppable` gap zones between every item (before first, between all, after last) + `useDraggable` on flexible tasks + `DragOverlay` floating clone.
- Adjacent gaps around the dragged item are `disabled` (not removed from DOM) to prevent layout shift.
- `onDragEnd` parses gap ID → counts anchors before that position → computes `newSlotIndex`; fractional midpoint of neighbors → `newSlotOrder`.
- Original item shows as a dim ghost (opacity 0.25, dashed outline) during drag so user sees "came from here."
- Gap zones expand to 32px with spring animation when hovered — the "making room" signal.
- All gap zones always rendered (fixed 8px height); only inner indicator line appears on hover. Zero layout shift on drag start.
- `PointerSensor` activation distance: 5px to prevent checkbox clicks triggering drag.

### 2026-05-26 — Row alignment fix (AI recommendation, Ofer approved)
- All rows (flexible task, fixed task, event) now share a 4-column CSS grid: `20px 22px 1fr auto` (drag-handle zone, icon/checkbox zone, label, meta).
- Absent elements (no drag handle on fixed tasks/events) use `visibility: hidden` placeholders to preserve column width.

### 2026-05-24 — Titlebar fixes (Ofer)
- Removed HTML `.lights` div — `titleBarStyle: 'hiddenInset'` already renders native macOS traffic lights.
- Fixed window drag: `.titlebar > *` was applying `-webkit-app-region: no-drag` to `.title-center` (inset:0), blocking all dragging. Scoped `no-drag` to `button, a, input, select` only.
