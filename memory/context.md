# Project Context

## Who is working on this

### Ofer Hashimshony
- Role: primary engineer, product owner, primary AI user
- Focus: implementation, architecture, day-to-day coding
- Git: `groot@Ofers-MacBook-Pro.local` / committer name "Ofer Hashimshony"

### Omri
- Role: co-owner, product direction
- Focus: product decisions, PRD, design direction

**How to identify who is in the session:**
Check `git config user.name` or the machine hostname. If it's Ofer's Mac, address Ofer.
If unclear, ask at the start: "Is this Ofer or Omri?"
Always note in `decisions.md` who drove each decision.

---

## What
Focus — macOS desktop app for a software engineer with ADHD.
Intelligent second brain: capture anything, AI classifies it, surfaces the right things at the right time.

## Current state (as of 2026-05-26)
- Full Electron app scaffolded and running (`npm start`).
- Today screen fully redesigned: today-only scope, fixed-anchor + flexible-task timeline, drag-and-drop reordering.
- Capture screen implemented with mock data.
- No backend, no AI, no DB yet — pure UI shell.

## Task scheduling model (implemented 2026-05-26)
- Two task kinds: `fixed` (has `startTime`, immovable) and `flexible` (has `slotIndex` + `slotOrder`, freely draggable).
- Timeline is a single interleaved list: flexible tasks float between fixed anchors (events + fixed tasks sorted by `startTime`).
- Fixed anchors divide the day into numbered slots (0 = before all anchors, 1 = after first anchor, etc.).
- `buildTimeline()` in `src/renderer/utils/timeline.ts` merges both kinds into one ordered array.
- Drag-and-drop uses gap zones (`useDroppable` between every item) + `DragOverlay` clone. NOT SortableContext.
- Adjacent gaps around the dragging item are disabled (not removed from DOM) to prevent layout shifts.
- `reorderTask(id, newSlotIndex, newSlotOrder)` in Zustand store handles all reordering; uses fractional indexing.
- Today screen shows only `timeSlot === 'today'` tasks + a collapsed "Upcoming" footer for future items.
- Overdue tasks (isOverdue: true) have their own section and their own DndContext above the today timeline.

## Key paths
- Design source: `/Users/groot/Downloads/Needle/` (local only, do not commit)
- Main entry: `src/main/index.ts`
- Renderer root: `src/renderer/main.tsx`
- Shared types + IPC contracts: `src/shared/`
- Styles: `src/renderer/styles/tokens.css` + `global.css`

## Non-negotiables
- Never add `nodeIntegration: true` or `contextIsolation: false`.
- All IPC goes through the typed contracts in `src/shared/ipc-contracts.ts`.
- v1 scope is Today + Capture only. Do not expand without Ofer + Omri alignment.
