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

## Current state (as of 2026-05-27)
- Full Electron app scaffolded and running (`npm start`).
- Today screen fully redesigned: today-only scope, fixed-anchor + flexible-task timeline, drag-and-drop reordering.
- Capture screen implemented with mock data (still raw inline styles — pending refactor).
- No backend, no AI, no DB yet — pure UI shell.
- **AI-first design system layer landed 2026-05-26**: 4 rules (`.cursor/rules/design-*.mdc`), 5 skills (`.cursor/skills/needle-*`), 5 docs (`design/`). Read `design/llms.txt` first for any UI task.
- **Today screen primitive refactor landed 2026-05-26**: 3-layer tokens (`primitives.css` + `tokens.css`), dark-mode contrast fixed (`--ink-3` now 5.6:1 AA-pass), 8 reusable primitives in `src/renderer/components/primitives/` (`Icon`, `Kbd`, `Divider`, `ProgressBar`, `Pill`, `Checkbox`, `Button`, `IconButton`), TodayScreen split into `TodayToolbar` / `QuickAddRow` / `UpcomingFooter` / `CaptureFab` + `dnd/` artefacts. TodayScreen.tsx cut from 626 → 218 lines. See `design/components.md` for the inventory.
- **Forward plan approved and started 2026-05-26**: plan lives at `docs/needle-forward-implementation-plan.md`. Baseline lint is clean. Step 1 model foundation, Step 2 unified row, and Step 3 first edit slice are complete: `docs/glossary.md`, ISO date utilities, real `Task.date` / `CalendarEvent.date` fields, optional future item metadata, date-filtered `buildTimeline()`, store-driven upcoming items, shared `ItemRow`, inline task expansion, notes, subtasks, and anchored item menu are in place.
- **V2 architecture branch started 2026-05-26**: `codex-v2-architecture` defines the next domain model in `docs/v2/` and `src/shared/domain-v2.ts`. Key decision: subtasks are first-class `Item`s connected by `ItemRelation(type='contains')`, not embedded `Subtask[]` durable state.
- **Daily-flow product direction encoded 2026-05-26**: v2 is now aimed at an AI-guided daily flow / intentional task manager, not a generic task database. North star lives at `docs/v2/product-direction.md`. The target model now includes `FlowSession`, `FocusSession`, `TransitionEvent`, `Reflection`, `Suggestion`, and `BehavioralInsight` so the app can support today-first planning, hard-time events vs flexible tasks, conscious transitions, gentle accountability, AI companion behavior, and future web/mobile/server sync.
- **V2 platform architecture plan added 2026-05-26**: planning now covers monorepo timing, NestJS modular-monolith backend, local-first sync/outbox, access control, coach/accountability access, notifications, metrics/logs, low-budget growth, and staged macOS -> server/web/mobile evolution. Start with docs: `docs/v2/architecture-guidelines.md`, `docs/v2/sync-access-observability.md`, `docs/v2/multi-app-roadmap.md`, and `docs/v2/research-notes.md`.
- **Torch intervention system built and iterated 2026-05-27**: full attention-takeover UX shipped. See decisions log for the full arc. Current stable state:
  - Full-screen dimming overlays on all displays (`TorchWindow`) with cursor spotlight, opacity ceiling 0.95 at full escalation (0.06 + intensity × 0.89), 12px blur.
  - `TorchBanner` embedded directly in each overlay (no separate window): compact strip at top, shows `title · in Xm · HH:MM`, two buttons — **Brain dump** and **Skip…**. Hover detection via `onMouseEnter/Leave` + `torch:set-interactive` IPC (Electron forward-event pattern) toggles click-through per window.
  - **Skip flow**: clicking Skip… → overlays become fully interactive → `SkipPanel` renders on all screens → reason selection (meeting or task flavours) + 4-second SVG countdown → confirms with `torch:skip-confirm` → main relays `torch:closed {reason:'skipped'}` → hides torch.
  - **Brain dump flow**: clicking Brain dump → overlays become fully interactive → `BrainDumpPanel` renders on all screens → Fraunces serif title, textarea, Save/Cancel → on submit `brainDumpText` is stored as a capture entry via `addCaptureEntry`.
  - All overlay windows get `data-theme='dark'` so design tokens resolve correctly.
  - `InterventionLayer` passes `meetingStartTime` (HH:MM derived from `ItemOccurrence.startsAt`) and `isMeeting` flag to `torch.show`. Capture window opens on cursor display (not always primary).
- **Live clock in Today toolbar 2026-05-27**: `LiveClock` component embedded in `TodayToolbar`, absolutely centered. Ticks every second. `var(--text-38)` monospace hours:minutes, muted AM/PM indicator, smaller muted seconds. Uses `font-variant-numeric: tabular-nums` — no layout jitter.

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
- `Task.date` is now `YYYY-MM-DD | null`; `dateLabel` carries row display copy. `CalendarEvent.date` is now `YYYY-MM-DD`; `endTime` exists for future event state.
- `ItemRow` is the shared row implementation for tasks and events. `TaskRow` / `EventRow` are compatibility wrappers while TodayScreen stays stable.
- Task rows can expand inline. Zustand owns `expandedItemId`, notes, subtasks, lead time, date planning, bucket changes, and delete actions. `ItemMenu` uses `@floating-ui/react`.
- Calendar meetings in mock data are event-only and non-checkable; prep work remains checkable Act items.
- V2 target introduces `Workspace`, `User`, `Actor`, `Item`, `ItemRelation`, `ItemAssignment`, `ItemPlan`, `ItemOccurrence`, `Comment`, `ActivityLog`, and sync operations for desktop/web/server support.

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
