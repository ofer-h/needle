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

### 2026-05-26 — AI-first design-system foundation (Ofer, AI recommendation accepted)
- Built persistent AI-readable knowledge layer **before** any app-code refactor. No `src/` changes.
- Trigger: dark mode unreadable + no formal design system + no AI persistence between sessions.
- Researched only gold-standard sources (Anthropic Skills, Radix Colors, W3C DTCG 2025.10, WCAG 2.2 AA, Apple HIG, high-star OSS). Curated in `design/sources.md`.
- Created lean core: 4 always-on rules (`.cursor/rules/design-*.mdc`), 5 skills (`.cursor/skills/needle-*`), 5 docs (`design/`).
- Skills follow Anthropic progressive-disclosure pattern: small `SKILL.md`, references on demand.
- Skill set: `needle-design-system` (router), `needle-ui-audit` (analysis), `needle-dark-mode-fix` + `needle-token-migration` (refactor, narrow-bridge), `needle-build-component` (template).
- Stayed with CSS variables — explicitly rejected Tailwind/vanilla-extract/Storybook/Chromatic.
- Spec at `docs/superpowers/specs/2026-05-26-needle-design-system-design.md`. Design-layer decisions log: `design/decisions.md`.
- Phase 2 (next): use the skills to run the real audit, fix dark mode, restructure `tokens.css` into 3 layers.

### 2026-05-26 — Today screen refactor + primitive library (Ofer, AI recommendation accepted)
- Audited Today screen UI and executed full token + component refactor in one chat. Single-batch landing (per Ofer: "no piecemeal").
- **Tokens:** Introduced `src/renderer/styles/primitives.css` (raw `--sand-*`, `--ink-*`, accents, plus `--space-*`, `--radius-*`, `--text-*`, `--duration-*`, `--ease-*` scales). `tokens.css` rewritten as pure semantic-layer references. Added missing tokens: `--surface-active`, `--border-strong`, `--icon-default`, `--icon-muted`, `--ink-disabled`, `--surface-disabled`. Fixed dark-mode `--ink-3` (`#807a70` → `#9a948a`, 4.2:1 → 5.6:1, passes WCAG AA).
- **Primitives:** Created 8 reusable primitives in `src/renderer/components/primitives/`: `Icon`, `Kbd`, `Divider`, `ProgressBar`, `Pill`, `Checkbox`, `Button`, `IconButton`. Each is `<Component>.tsx + .css + index.ts`; all classes namespaced `ds-*`. `Icon` wraps the existing `Icons.tsx` glyph source (kept in place since Capture still imports raw glyphs — Capture migration deferred).
- **Domain refactor:** `TaskRow` and `EventRow` rebuilt to consume `Checkbox`, `Pill`, `Icon`, `IconButton`. `TaskRow` now has a single `RowBody` shared between fixed and flexible variants (no triplicated bodies). Drag handle migrated to `IconButton` with hover-reveal pattern.
- **Screen split:** `TodayScreen.tsx` cut from 626 lines to 218, purely orchestration. Extracted `TodayToolbar`, `QuickAddRow`, `UpcomingFooter`, `CaptureFab`. DnD artefacts moved to `Today/dnd/` (`GapDropZone`, `OverlayRow`, `reorder.ts`).
- **A11y fixes:** Quick-add row now responds to Enter/Space. Upcoming toggle has `aria-expanded` + `aria-controls` + `aria-label`. All buttons have `:focus-visible` outlines. `prefers-reduced-motion` respected on all transitions.
- **Lint config:** ESLint flat config lacked browser/node globals → 23 pre-existing `no-undef` errors. Added `globals` package import + per-folder language options. Lint now passes everything in Today scope; 4 pre-existing errors remain in `CaptureScreen` and `main/ipc/index.ts` (out of scope).
- **Verification:** `npm run typecheck` clean. `npm run lint` clean for all touched files. `vite build` succeeds, renderer bundle 215 KB / 21 KB CSS gzipped.
- **Out of scope (still pending):** Capture screen refactor, completion animation, item expansion, single-FAB enforcement (PRD says only FAB; current screen has toolbar CTA + quick-add + FAB), keyboard reorder via `KeyboardSensor`, empty state, store-driven upcoming list.

### 2026-05-26 — Forward plan approved (Ofer, AI recommendation accepted)
- Reviewed the Claude plan at `/Users/groot/.claude/plans/analize-this-project-the-spicy-hamming.md` against `PRD.md`, current Needle implementation, `.cursor/rules`, `.cursor/skills`, `design/`, and project memory.
- Decision: use the Claude plan as the strategic map, but execute conservatively: clear baseline lint first, then tighten Phase 0 around real ISO dates, unified row modeling, and a stable type surface before feature UI.
- Product direction reaffirmed: inline expansion is the primary edit UI; non-modal anchored menu handles cross-row actions; meetings do not get checkboxes and instead derive state from the wall clock.
- Vocabulary direction reaffirmed: `Act` / `Remember` are buckets; `Anchor` / `Float` are UI-facing scheduling language; keep `fixed` / `flexible` TypeScript enums for now to avoid DnD churn.
- Repo-visible plan: `docs/needle-forward-implementation-plan.md`.

### 2026-05-26 — Forward plan execution started (Ofer, AI implemented)
- Completed Step 0 baseline hygiene: replaced a main-process `require('electron')` with an ESM `nativeTheme` import and escaped Capture JSX text that violated lint.
- Started and verified Step 1 model foundation: added `docs/glossary.md`, `src/renderer/utils/date.ts`, ISO-backed task/event dates, `dateLabel`, event `endTime`, and optional future fields (`subtasks`, `notes`, `leadTimeMins`, `relations`, `source`).
- Updated mock data to cover yesterday, today, tomorrow, in-three-days, and unplanned stash items; `UpcomingFooter` now reads store data instead of a hardcoded local placeholder.
- Updated `buildTimeline()` to accept an optional `forDate` filter while preserving the current Today UI and DnD behavior.
- Verification: `npm run typecheck` and `npm run lint` both pass.

### 2026-05-26 — Unified item row landed (Ofer, AI implemented)
- Added `src/renderer/components/Today/ItemRow.tsx` as the shared implementation for task and event rows, with a discriminated `kind: 'task' | 'event'` prop.
- Kept `TaskRow.tsx` and `EventRow.tsx` as thin compatibility wrappers so `TodayScreen` and existing DnD behavior remain stable for this step.
- Preserved current row anatomy: tasks keep checkbox/drag/date/link behavior; events keep calendar icon/time pill and remain non-checkable.
- Updated `design/components.md`, `memory/context.md`, and `docs/needle-forward-implementation-plan.md`.
- Verification: `npm run typecheck` and `npm run lint` both pass.

### 2026-05-26 — Inline item editing first slice (Ofer, AI implemented)
- Installed `@floating-ui/react` using `npm install @floating-ui/react --legacy-peer-deps`, matching the repo's existing dependency-resolution pattern for the ESLint peer conflict.
- Added Zustand actions for `expandedItemId`, subtasks, notes, lead time, date planning, bucket changes, and deleting tasks.
- Added `ItemDetail`, `SubtaskList`, and `ItemMenu`; task rows now expand inline, show subtask progress, preserve checkbox/drag behavior, and use an anchored kebab menu for row actions.
- Added keyboard support for the first edit slice: `Esc` collapses an expanded item and `Cmd-E` expands the focused task row.
- Running-app smoke caught that the mock `Daily standup` existed as both a checkable task and a calendar event; removed the task fixture so meetings remain event-only and non-checkable.
- Verification: `npm run typecheck`, `npm run lint`, `git diff --check`, and a running Electron smoke pass. `npm install` reported 25 audit issues; audit remediation was left for a separate security/dependency pass.

### 2026-05-26 — V2 domain architecture branch (Ofer, AI recommendation accepted)
- Checkpointed and pushed the current inline-edit work on `master`, then created `codex-v2-architecture` for the next-level app model.
- Audited the current model and decided embedded `Subtask[]` is transitional only; durable subtasks are first-class `Item`s connected by `ItemRelation(type='contains')`.
- Added v2 architecture docs under `docs/v2/`, a Superpowers-style spec at `docs/superpowers/specs/2026-05-26-v2-domain-architecture.md`, and a domain workflow skill at `.cursor/skills/needle-domain-architecture/SKILL.md`.
- Added `src/shared/domain-v2.ts` with target shared contracts for workspace/user/actor/item/relation/assignment/plan/occurrence/comment/activity/sync models.
- Next implementation step: build a domain fixture/store adapter so the current Today UI can read from v2-shaped state before replacing embedded subtasks in the UI.

### 2026-05-26 — Daily flow product direction encoded (Ofer, AI implemented)
- Ofer provided the guiding PRD: Needle should become a calm AI-guided daily flow / intentional task manager, centered on today, hard-time commitments, flexible tasks, conscious transitions, gentle accountability, and AI as companion rather than operator.
- Added `docs/v2/product-direction.md` as the v2 product north star and linked it from the v2 README and Superpowers spec.
- Extended the v2 architecture with `FlowSession`, `FocusSession`, `TransitionEvent`, `Reflection`, `Suggestion`, `BehavioralInsight`, and `DailyFlowView`.
- Data model now reserves tables/indexes for daily flow state, focus history, transition prompts, lightweight reflections, optional AI suggestions, and long-lived behavioral insights.
- Sync/web notes now treat user edits as source of truth, suggestions as optional/reversible, and behavioral insights as low-frequency records that should not block daily planning.
- Roadmap now includes a Daily Flow State phase before deeper AI automation so the product can answer "what should I focus on right now?" without becoming noisy or over-automated.

### 2026-05-26 — V2 platform architecture plan (Ofer, AI recommendation accepted)
- Ofer asked for a detailed forward architecture covering native/web/mobile, data sync, monorepo structure, NestJS backend, coach/accountability access, notifications, metrics/logs, low-budget growth, and safe folder-change recovery.
- Decision: keep macOS/Electron first, then local SQLite, then extract shared TypeScript domain/tokens, then add NestJS/Postgres sync, then web, Expo mobile, and coach/accountability surfaces.
- Decision: do not migrate folders to a monorepo yet; use a checkpoint branch and `git mv` only when a second app/server/package makes it worth the risk.
- Added architecture docs: `architecture-guidelines.md`, `sync-access-observability.md`, `multi-app-roadmap.md`, and `research-notes.md`.
- Extended the v2 data/type model with invitations, devices, notification preferences/events/deliveries, app sessions, usage events, and sync cursors.

### 2026-05-27 — Torch intervention system: full build (Ofer directed, AI implemented)

**Overlay hardening**
- Raised opacity ceiling to 0.95 (`rgba(22,22,26, calc(0.06 + intensity * 0.89))`), blur to 12px. Screen is functionally unreadable at full escalation — intentional hard block.
- Escalation curve: ease-out (fast start, slows toward ceiling).

**Hero banner → embedded TorchBanner**
- Decided to remove the separate `heroBannerWindow` and embed the action strip directly inside each full-screen `TorchWindow` overlay.
- Reason: separate window had z-order + focusable issues that broke button clicks; embedding in the overlay is architecturally cleaner and shows the banner on every display simultaneously.
- `TorchBanner` component: compact 48px bar, absolutely positioned at top of overlay, centered with `left:50%; transform:translateX(-50%)`.
- Click-through is managed with Electron's documented hover-detection pattern: overlay stays `setIgnoreMouseEvents(true, { forward:true })` by default; `onMouseEnter` sends `torch:set-interactive {interactive:true}` → main calls `win.setIgnoreMouseEvents(false)` on the sender window; `onMouseLeave` restores pass-through.
- New `torch:set-interactive` IPC channel; main identifies sender via `event.sender` + `BrowserWindow.fromWebContents`.

**Banner buttons**
- "I'm on it" removed — replaced by context (countdown + clock tells user the urgency; no need to dismiss via a soft button).
- Two buttons: **Brain dump** (launches brain-dump mode) and **Skip…** (launches skip mode).
- Banner hides automatically when skip or brain-dump panel takes over.

**Skip flow (Ofer directed)**
- `torch:skip-init` → `enterSkipMode()`: makes all overlays interactive, broadcasts `torch:hero {mode:'skip'}`.
- `SkipPanel` renders on every display: reason radio buttons (meeting or task flavours), optional free-text "Other" field, 4-second SVG countdown button that shows `Skip (3)…` and cancels if clicked again.
- On confirm: `torch:skip-confirm {correlationId, reason, notes}` → main relays `torch:closed {reason:'skipped', skipReason, skipNotes}` → hides torch.
- On cancel: `torch:skip-cancel` → `exitSkipMode()` → overlays back to pass-through, banner reappears.
- `InterventionLayer` resolves intervention as 'acknowledged' for both 'acknowledged' and 'skipped' reasons.

**Brain dump flow (Ofer directed)**
- `torch:brain-dump-init` → `enterBrainDumpMode()`: overlays become interactive, broadcasts `torch:hero {mode:'brain-dump'}`.
- `BrainDumpPanel` renders on every display: Fraunces serif title, subtitle with event name, large textarea, "Save & continue" / "Cancel" buttons, `⌘↵` keyboard shortcut.
- All tokens resolve correctly because `main.tsx` now sets `data-theme='dark'` on `<html>` for torch-mode windows.
- On submit: `torch:brain-dump-submit {correlationId, text}` → main relays `torch:closed {brainDumpText}` → hides torch.
- `InterventionLayer` calls `addCaptureEntry({body: brainDumpText})` before resolving the intervention.
- On cancel: `torch:brain-dump-cancel` → `exitBrainDumpMode()` → back to normal mode.

**IPC contracts added**
- `TorchShowPayload`: `+meetingStartTime?: string`
- `TorchDismissReason`: `+'skipped'`
- `TorchClosePayload`: `+skipReason?, +skipNotes?, +brainDumpText?`
- New: `TorchHeroPayload {mode: 'skip'|'brain-dump'|'normal'}`
- New: `TorchSkipConfirmPayload`
- New: `TorchBrainDumpSubmitPayload`
- New: `TorchSetInteractivePayload`
- Preload + `window.d.ts` mirror all new channels.

**`InterventionLayer` wiring**
- Resolves `ItemOccurrence.startsAt` → HH:MM local string → passed as `meetingStartTime` to `torch.show`.
- `isMeeting` = linked item has `commitmentLevel === 'unmissable'`.

**Capture window fix**
- `capture.ts`: replaced `screen.getPrimaryDisplay()` with `screen.getDisplayNearestPoint(screen.getCursorScreenPoint())` — brain-dump always opens on the display the user is actively on.

### 2026-05-27 — Parallel agent branches merged into needle-ai-orchestration (Ofer + AI orchestration)

**What:** Integrated four agent workstreams onto `needle-ai-orchestration` from base `d63515b`.

| Agent | Branch | Landed as |
|-------|--------|-----------|
| C | `7305147` (via cherry-pick; `agent/capture-refactor` was empty) | `e53d335` |
| A | `agent/v2-store-adapter` | merge `4856a09` |
| B | `agent/sqlite-persistence` | merge `c1593d2` |
| D | `agent/anthropic-api` | merge `dc5fa78` |

**Why:** Single integration branch for AI orchestration work without force-push; preserve both `db:*` and `ai:*` IPC and preload bindings.

**Verification:** typecheck + lint (0 errors) + 14 vitest tests pass after `npm install --legacy-peer-deps`. `npm run package` fails on adhoc/notarize signing in dev (expected).

**Open questions:**
- Wire Today to v2 adapter and/or SQLite hydrate.
- Persist classify results via `db:add-capture` / task create.
- Whether to bump `agent/capture-refactor` to track full integration tip or keep it capture-only.

### 2026-05-27 — Local `.env` for Anthropic API key (Ofer + AI)
- **What:** `dotenv` loads repo-root `.env` in main before bootstrap (`src/main/load-env.ts`); `.env.example` documents `ANTHROPIC_API_KEY`. Dev only — `app.isPackaged` skips file load.
- **Why:** Faster local classify smoke tests without pasting the key into Capture UI every time; env still wins over userData `config.json`.
- **Path:** `.vite/build/main.js` → `../../.env` with `electron-forge start`. Packaged builds: use OS env or Capture API key UI.
- **Plan:** `docs/next-integration-steps.md` — phases 2–4 (SQLite hydrate, classify persist, v2 Today dogfood).

### 2026-05-27 — Wire SQLite + capture persist into renderer (Ofer + AI)

**What:** Today uses `hydrateFromDb()` on app mount; Zustand starts empty and loads from `window.api.db`. All Today mutations (`toggleDone`, subtasks, notes, reorder, delete, etc.) call `db:update-task` / `db:delete-task`. Removed duplicate `MOCK_*` data from `store.ts` (seed remains in main `seedIfEmpty` only). Capture classify and intervention brain-dump / capture-window entries call `db:add-capture`.

**Why:** Merged agent work was in the codebase but invisible to the UI — two parallel data worlds (mocks vs SQLite).

**Open:** Phase 4 v2 Today dogfood; optional task create from classification payload.

### 2026-05-27 — Live clock in Today toolbar (Ofer directed, AI implemented)
- Added `LiveClock` component inline in `TodayToolbar.tsx` — no new file.
- Ticks every second via `setInterval(1000)`.
- Layout: absolutely centered in the toolbar (`position:absolute; left:50%; transform:translateX(-50%)`), positioned above content layers, `pointer-events:none`.
- Typography: `var(--text-38)` + `var(--mono)` + `font-variant-numeric:tabular-nums` for hours:minutes (no layout jitter), muted `var(--text-13)` sans for AM/PM, muted `var(--text-16)` mono for seconds.
- Rationale: ADHD users need persistent, glanceable time awareness. Centered placement makes it a passive ambient anchor without competing with the task list.

### 2026-05-27 — Async UX + observability baseline (user request + AI)

**Canonical doc:** `docs/decisions/2026-05-27-async-ux-and-observability.md` (implementation map, verify steps, open gaps).

**What (async UX):** `usePendingOperation`, `AsyncStatusPanel`, Capture classify (30s timeout, cancel, slow hint, error screen), API key save (10s). Prior fixes: `.env` dual-path load, classify/save error handling, `needleLog` / `uiLog`.

**What (observability):** `flow-health` ring buffer, `app:getFlowHealth`, `flowId` on classify in main, BuildDiagnostics last-classify line. Docs: `docs/async-ux.md`, `docs/observability.md`. Rules/skills: `async-ux.mdc`, `observability.mdc`, `needle-async-ux`, `needle-observability`, `needle-debug-app-state`. Phases 0 + 0b in `docs/next-integration-steps.md`.

**Why:** Endless “classifying” dots and silent failures are unacceptable for a companion app; need reproducible debug path and agent governance.

**Open (see decision doc P0–P2):** hydrate pending UI, silent DB persist, fire-and-forget `addCapture`, packaged main logs, pass `flowId` to renderer.
