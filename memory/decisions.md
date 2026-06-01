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

### 2026-05-27 — Merge orchestration to master (Ofer + AI)
- **What:** Fast-forward `master` to `731b155` (`needle-ai-orchestration` + `.env` override fix). Pushed `origin/master`.
- **Next branch:** `needle-integration-followup` for P0 async/observability gaps and Phase 4 optional work.

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

### 2026-05-27 — AI capture review blocks + v2-only persistence (Ofer directed, AI implemented)
- Branch: `codex-ai-planning-foundation`.
- Product direction: free-text capture is the first AI-native planning loop, but the user remains in control. The app must show the original text, generated blocks underneath, and editable structure before committing anything.
- AI contract: `ai:classify` now asks Claude to return a top-level summary plus `items[]`, where each parsed item carries `itemType` (`task`/`event`), `scheduleMode` (`flexible`/`fixed`), bucket, optional date/time, reasoning, and confidence.
- UI: Capture classified state renders editable generated blocks with title editing, task/event conversion, today/tomorrow/later/someday placement, flexible/fixed mode, optional time, split, merge, and remove controls.
- Persistence: confirming drafts now calls `db:create-planning-items`, which writes v2 `items`, `item_plans`, `item_occurrences`, `capture_entries`, and `activity_log` rows. AI drafts do not silently mutate Today before confirmation.
- UI bridge: Today still consumes the current `Task` / `CalendarEvent` view model, but `getAllTasks()` / `getAllEvents()` are v2 projections. New capture-created work is not written to legacy `tasks` / `calendar_events`.
- Fresh demo seeding now creates v2 rows through the same planning endpoint, so new local databases start on the v2 path.
- Cleanup: because there is no local data to preserve, `003_drop_legacy_tables` drops `tasks`, `calendar_events`, and `capture_entries`. Raw captures now write to `v2_capture_entries`.
- Tradeoff: the renderer still uses the existing Today view model and IPC method names for now, but the repository behind those methods is v2-only.
- Subtasks: `v2_item_relations(type='contains')` now stores child item links. Add/toggle/remove subtask actions create and update child `v2_items`; `Task.subtasks` is now only a Today adapter projection.
- Next migration: move the Today store state itself to v2 domain records and stop exposing `Task.subtasks` outside the adapter.

### 2026-05-27 — Today screen first-class child-item pass (Ofer directed, AI implemented)
- Product correction: the Today surface should not treat subtasks like passive nested checklist lines. Child work needs visible edit/move/promote affordances and should share the same product language as task rows wherever possible.
- Today DnD: Overdue and Today now share one drag context, so dragging an overdue flexible task into Today actually reparents it onto today's plan instead of implying a behavior the UI did not support.
- Child-item actions: `SubtaskList` now renders editable child-item cards with title/notes editing, up/down reorder controls, move-to-another-task, and promote-to-standalone actions. Task detail also lets a standalone task move under another task explicitly.
- Event/task parity: calendar event rows now expand into editable detail (`EventDetail`) so synced or timed items can change title, date, time, notes, or remove time to become a task. They are no longer display-only rows.
- Capture review honesty: generated planning blocks now live in a scroll-bounded review area, `Split` is disabled unless a split is actually possible, and unfinished Voice / file-drop buttons were removed rather than leaving fake clickable UI.
- Tradeoff: drag gestures for subtask-in/out-of-parent are still not implemented. The UI now exposes explicit move/promote controls instead of pretending gesture support exists.
- Verification: `npm run typecheck`, `npm run lint`, and `git diff --check` passed. `npm run test` is currently blocked by a local `better-sqlite3` native-module mismatch against the host Node runtime. `npm run package` still fails in local codesign finalization.

### 2026-05-27 — Calm Breathing Helper "Hearth Pomodoro" Integration (Ofer approved)
- Locked the decision to include the "BREATH Calm breathing helper" (visually represented as a breathing, pulsing Hearth circle Pomodoro timer) as a core cognitive UX mechanism on the active Focus card.
- User feedback was extremely enthusiastic ("I love this... super simple UI, very nice idea").
- Animation guide: The circle core slowly pulses using a gentle 5-second CSS expand/contract keyframe animation. Cued with clear instruction: "Inhale as the circle expands, exhale as it contracts."
- Purpose: Serves as a soothing, non-anxiety visual anchor to regulate breathing, manage time blindness, and defend against sensory overload or task-switching friction.

### 2026-05-28 — Monorepo + NestJS backend direction (Ofer)
- Merged `codex-ai-planning-foundation` to `master` (fast-forward, pushed). Opened `v2-monorepo` branch for the platform refactor. Full plan: `docs/v2/monorepo-migration-plan.md`.
- Confirms and pins the existing `architecture-guidelines.md` / `multi-app-roadmap.md` direction with concrete tech: NestJS modular monolith + Postgres, ts-rest contract, better-auth, Vite-SPA web, Expo mobile deferred, pnpm + Turborepo.
- Delivery model: **two paths, one shared core.** Path A = macOS standalone/local-first (local SQLite, never blocked, keeps shipping core+MVP). Path B = cloud track (NestJS+Postgres+auth+web+mobile, server-of-record). Connect later via a **sync adapter**, not a rewrite.
- Anti-divergence guardrail: both paths consume the same shared domain (`packages/domain` + `packages/contract`); Mac SQLite and BE Postgres are two storage representations of ONE model. Mac data already actor/workspace-scoped, so it maps onto a real account when connected.
- Two seams enable it: transport-agnostic shared UI (`packages/ui-web`, components take data via props/context), and the Mac's existing `window.api` IPC boundary as the connect seam (swap behind the handlers, renderer unchanged).
- Multi-user from day one. Auth is provider-agnostic: business logic only ever sees an internal `userId`; linked providers live in a separate `auth_identities` table so Google→Okta/Auth0 swaps touch only `AuthModule`. **Authorization is its own layer** (`AccessModule`), checking ownership/role on the internal `userId`, never trusting the auth provider for permissions.
- pnpm + Turborepo adopted from the start (deviates from the docs' "keep npm" default).
- Migration: **Foundation** (F0 tooling → F1 extract domain+contract → F2 move desktop → F3 extract ui+tokens) builds the shared spine, then two parallel tracks (A: Mac standalone ongoing; B: backend → web → mobile), then the deferred Bridge (Mac sync adapter). Each phase one green commit. No code written yet — plan only, pending Ofer's go on the Foundation bootstrap.

### 2026-05-29 — Monorepo runtime validation + ⌘K crash fix + pnpm nodeLinker fix (Ofer directed, AI implemented)
- **Runtime smoke on `v2-monorepo`:** `pnpm start` boots `@needle/desktop` end-to-end — Forge preflight (`pnpm@11.1.3`), Vite main+preload, `.env` `ANTHROPIC_API_KEY`, `[boot] ready` (v0.1.0, gitSha `fc56ed4`, `apiKeySource env`), renderer `app:getDiagnostics` + `app:getFlowHealth` IPC. SQLite opens with no `better-sqlite3` error. Foundation pass (F0–F2, D, P) now runtime-verified; pixel-level GUI still owner-verify.
- **⌘K crash fix:** Closing the main window on macOS left a destroyed `BrowserWindow` reference; ⌘K threw `Object has been destroyed`. Added `ensureMainWindow()` in `apps/desktop/src/main/index.ts` — recreates window when null/destroyed, `closed` handler nulls `mainWindow`, ⌘K and `activate` use the helper.
- **pnpm 11 hoisted layout:** Electron Forge preflight failed ("node-linker must be set to hoisted") because pnpm 11 reads `nodeLinker` from `pnpm-workspace.yaml`, not `.npmrc`. Added `nodeLinker: hoisted` to `pnpm-workspace.yaml`, removed ineffective `apps/desktop/.npmrc`, re-ran `pnpm install` (hoisted relink + native rebuild). Root `.npmrc` line remains (harmless, cleanup later).
- **Stale artifact cleanup:** Killed orphaned pre-migration Electron process; removed root `.vite/` and `dist/` (canonical build is `apps/desktop/.vite`). Original ⌘K error had come from the stale root build at `/Users/groot/dev/needle/.vite/build/...`.
- **Verification:** `pnpm run typecheck` + `pnpm run lint` green after ⌘K fix; boot logs confirm IPC + SQLite + env load.

### 2026-05-31 — Studio UI redesign: `@needle/ui-web` + `apps/studio` (Ofer directed, AI implemented)
- **What:** A simpler, beautiful, browser-viewable redesign of the app UI as a reusable design system (`packages/ui-web`) demoed by a thin Vite app (`apps/studio`). `apps/desktop` is untouched this round. This is the monorepo plan's **F3 seam** (extract shared web UI + tokens). Full record: `docs/v2/studio-redesign.md`; ADR: `docs/decisions/2026-05-31-ui-web-studio-redesign.md`.
- **Core decision (D2):** **One canonical item model; templates are pure presentation config** (open/closed). Switching or building a template never touches data — it registers a config object. Default template = **Editorial** (calm, centered); Compact/Timeline/Kanban in the gallery; plus a basic template builder.
- **Model (D3):** Reuse `@needle/domain` (`domain-v2.ts`) entities; new presentation/logic types live in `packages/ui-web/src/model/*` marked "promote into domain once validated" so the shipping domain package stays stable. All `model/*` logic is pure (testable): `buildTodayView`, `deriveCountdown` + alert-style rotation (ADHD anti-habituation), `coachEngine` (gamified/coached/self), scripted `applyChat`, append-only `RevisionLog` (revertible AI changes), 5/5/5 `RitualInstance`.
- **Documented divergence (D9):** the `model/index.ts` barrel is intentional ("one place to see every moving part") — `typescript.mdc`'s no-barrel rule targets the Electron renderer, not a publishable package.
- **Data (D6/D7):** mock/local seed; AI + coach + chat scripted/deterministic (no backend/LLM); every AI change is visible, attributed, and revertible.
- **Status:** **Phase 0 done** — `ui-web` + `studio` scaffolded, tokens/fonts/primitives ported (self-contained via `@fontsource`), full `model/` layer written, studio shell with theme + scenario nav. Both packages typecheck; each got its own `eslint.config.mjs` + `lint` script. Phases 1–4 (the actual UI: TodayBoard/ItemLine/InlineAdd → Countdown/events → coach/chat/ritual → builder/kanban) pending.
- **Conventions:** follows `.cursor/rules/` (tokens, primitives, react, testing); package-specific guidance in `packages/ui-web/CLAUDE.md` + `.cursor/rules/ui-web.mdc`. Relevant skills going forward: `needle-build-component`, `needle-design-system`, `needle-add-token`.
- **Progress (end of 2026-05-31 session):** Phases 0–3 DONE and verified in-browser (Today/ItemLine/InlineAdd/3 layouts; Countdown + alert rotation + travel-prep + scenario clock; BrainDump + CoachPanel 3 modes + ChatDock + RevisionTimeline with working undo). **Phase 4 (~70%, mid-flight, repo does NOT compile):** KanbanLayout + TemplateBuilder built+registered, `useTemplates` localStorage hook + `TemplatesScreen` written; **remaining:** wire `apps/studio/src/App.tsx` to pass the new `templates` prop + route Templates/Components screens, add gallery CSS to `screens.css`, create `GalleryScreen.tsx`, verify, mark docs done. **Full continuation guide: `docs/v2/studio-handoff.md`** (exact state, steps, run instructions, file map, gotchas). Nothing committed yet (untracked `packages/ui-web/` + `apps/studio/`).

### 2026-05-31 — Master plan: Desktop next-level + the Transition System (Ofer directed, AI authored)
- **What:** Reconciled three inputs — Ofer's freeform direction, the Cursor "Needle desktop next level" plan, and the Codex "Desktop-First" plan — into one authoritative, implement-ready, subagent-parallelizable master plan: **`docs/v2/needle-next-master-plan.md`**. Raw requirements captured verbatim in **`docs/v2/needle-next-master-plan-DRAFT.md`** (appendix of record). Added both to the `docs/v2/README.md` index.
- **Key architectural decision (Ofer's call, AskUserQuestion):** new feature UI lands in **`@needle/ui-web`** (pure + presentational), previewed in **`apps/studio`** (browser), then **consumed by `apps/desktop`** (native shell only). Honors the monorepo F3 seam; **overrides** Codex/antigravity's "build straight into desktop."
- **Conflicts resolved in the plan:** (D2) subtasks stay first-class `Item` + `ItemRelation(type='contains')` — **rejected the antigravity plan's embedded recursive `Subtask[]` redefinition**; (D3) tag colors are **curated semantic tokens, not raw hex** (rejected antigravity/Cursor `color: string`); (D4) `commitmentLevel` stays internal, tags are user-facing; (D5) unify desktop's dual store onto one v2 model; (D6/D7) the transition logic is **one pure `deriveTransitionBlocks(anchors, rules, settings, now)`** whose derived system-blocks are **real, visible, editable timeline items** AND the single source the unified overlay reads.
- **The heart — Transition System:** answers Ofer's "what is the event / what triggers it / how do I see it coming." Anchor (timed commitment) + Rules (reuse `Ritual`) → derived blocks (`leave_by`/`brain_dump`/`break`/`plan_next`/`prep`) shown in advance on the timeline and surfaced at trigger time as **one unified overlay** with fuse/skip/postpone. **Root cause of the double-screen bug confirmed in code:** `ritualPreMeeting` in `fixture-v2.ts` fires 3 actions (`modal_capture` 14:55 on the prep task + `attention_takeover_torch` 14:59 on the event + `escalated_alert` 15:00); `InterventionLayer.tsx` drives capture + torch windows in two effects keyed to different `itemId`s → blink + two dumps. WP-B4 retires that path.
- **Reuse discovery:** corrected the stale "repo does NOT compile" memory — `studio-handoff.md` shows ui-web+studio typecheck GREEN. Most "new" features already exist in `ui-web` (BrainDump 5/5/5, Countdown+rotation, addTravelPrep→leave-by, CoachPanel 3 modes, ChatDock, RevisionTimeline undo, relation-backed `childrenOf`). Genuinely new: `deriveTransitionBlocks`, the `Tag` model, the unified `TransitionOverlay`, recursive 3-level `ItemLine`, desktop v2 unification, native spikes. Captured as a REUSE table in the plan (§5.1).
- **Research (live web pass, sources in plan §9.4):** **Rewind.ai sunset** (Meta acquired Limitless, capture disabled 2025-12-19; EFF found zero leaks Sept 2024; ~3750× compression) → privacy-first local "time machine" is now a market gap; **screenpipe** is the OSS heir. **Microsoft Recall** = cautionary tale → non-negotiable defaults: opt-in, encrypt-at-rest, OS-auth to view, per-app exclusion, visible indicator, one-tap pause, no capture-everything. ScreenCaptureKit+AVAssetWriter `movieFragmentInterval` ring buffer confirmed feasible (~2–5MB/min; watch SCK err 3821, separate audio inputs). Sunsama (calm commit-ritual) + Akiflow (fast NL capture) → want both. ADHD: visibility > alerts; rotate modality to beat habituation.
- **Status:** Plan only — **no code written, nothing committed.** Next on go: WP-B1 (verify+commit the green studio base) → DOC-A1 (transition-system spec) → fan out.

### 2026-05-31 — Desktop Today screen now renders ui-web TodayBoard w/ SQLite persistence (AI implemented)
- **What:** `apps/desktop`'s `today` screen renders `@needle/ui-web`'s `TodayBoard` from the canonical `TodayData` model, persisted to SQLite. New `apps/desktop/src/renderer/components/Today/TodayBoardScreen.tsx` (mirrors `apps/studio/src/screens/TodayScreen.tsx` composition: `ProgressKudos` + `InlineAdd` + inline/floating `Countdown` + `TodayBoard`, `BUILTIN_TEMPLATES.editorial`). Legacy `TodayScreen.tsx` left on disk, unreferenced. Capture screen + InterventionLayer untouched.
- **Persistence:** `getTodayData` / `saveTodayData` in `apps/desktop/src/main/db/repository.ts` map v2 tables ↔ domain-v2 entities. Table→entity: `v2_items`→`Item`, `v2_item_plans`→`ItemPlan` (`relative_to_occurrence_id`+`relative_offset_minutes`→`plan.relativeTo`), `v2_item_occurrences`→`ItemOccurrence`, `v2_item_relations`→`ItemRelation`, `v2_tags`→`Tag`, `v2_item_tags`→`ItemTag`. `saveTodayData` = single `db.transaction()`: delete-all-for-workspace then re-insert. Migration `004_tags.ts` adds `v2_tags` + `v2_item_tags`.
- **IPC:** `db:get-today-data` / `db:save-today-data` (db-handlers + ipc/index auto via `registerDbHandlers`); `window.api.db.getTodayData()/saveTodayData()` in preload + `window.d.ts`. `now` driven by the dev clock (`frozenIso`) + 1s tick.
- **Boundary calls:** `main`/`preload` never import ui-web RUNTIME. `repository.ts` defines `TodayData` structurally from `@needle/domain` (local `Tag`/`ItemTag` types, since those live only in ui-web's model). `preload` imports the `TodayData` TYPE from the component-free `@needle/ui-web/model` subpath — the `.` barrel pulls `.tsx` components that the JSX-less preload tsconfig can't compile.
- **Wiring gap fixed:** `@needle/ui-web` was NOT actually a desktop dependency despite the handoff note — added one line to `apps/desktop/package.json` + the workspace link in `pnpm-lock.yaml` (minimal: +1 / +3 lines).
- **Verification:** `pnpm --filter @needle/desktop typecheck` + `lint` both GREEN. Repository vitest suite blocked by the known `better-sqlite3` NODE_MODULE_VERSION 145≠127 ABI mismatch in this env (pre-existing, not from this change). Did not run `pnpm start`.
- **Seed bridge:** existing `seedIfEmpty` already writes v2 rows `getTodayData` reads (standup 10:30 event, manager 1:1 15:00, subtasked prep task, flexible tasks, overdue "Call back Dana"), all under `ws_personal`. No new seed added.

### 2026-05-31 — Master-plan execution: parallel transition-coach build (Ofer directed, AI orchestrated)
- **What:** Executed `docs/v2/needle-next-master-plan.md` on branch `needle-next-master` using parallel subagents. The desktop app now runs the new transition-coach UI from shared `@needle/ui-web`, persisted to SQLite, with ONE predictable transition flow (verified by booting + screenshot: the unified overlay fires at clock 14:54 before the 3pm meeting — rail Brain dump → Plan next → Break, per-block countdown, Done/Skip).
- **ui-web (new):** `model/transition.ts` (pure deriveTransitionBlocks/activeTransition/declineBlock — the heart), `model/tags.ts` (token-colored tags, no raw hex), `model/feedback.ts` (sound/haptic/celebration bus), `TransitionOverlay`, `SettingsPanel` (reorderable 5/5/5 + notifications), recursive 3-level `ItemLine` (collapse, no leaf placeholder, tag chips, row menu delete/move), `TagChips`, `DraftBlocks` (AI clean-up preview), `BreathHearth`+`GlassBubbleMat` (from v7), plain-text composer (dropped */**). 75 model tests pass.
- **desktop:** consumes ui-web styles + TodayBoard from v2 SQLite (today-data.ts get/save, migration 004 tags, db:get/save-today-data IPC); `TransitionLayer` (one in-window overlay) replaced the racing InterventionLayer (modal_capture + torch); SettingsScreen; feedback sink; calm 09:00 dev-clock.
- **Bugs caught by running it (not just typecheck):** dev clock UTC vs local wall-clock → overlay never fired (fixed); App didn't update in-memory state on edit (fixed in the lifted-state refactor).
- **docs:** brain-dump-and-time-machine.md (DOC-A2) + meeting-awareness.md (DOC-A5) — privacy-first native capture/meeting-detection, flagged/off (Recall lessons; Rewind sunset).
- **Verification:** all 4 workspaces typecheck + lint GREEN; ui-web 75 tests pass; desktop boots + SQLite + IPC OK.
- **Known issue (pre-existing, NOT a regression):** desktop vitest repo tests (7) fail on better-sqlite3 NODE_MODULE_VERSION 145≠127 — vitest runs under system Node, electron-forge rebuilds the module for Electron. App runs fine; test-infra fix deferred.
- **Deferred by design:** native capture/meeting spikes (specs only); template switcher + add-event surfacing on desktop (ui-web has both; desktop wiring is a follow-up).

### 2026-06-01 — Desktop UI shell repair + appearance control + inline subtasks; two latent bugs fixed (Ofer directed, AI implemented)
- **What:** Fixed the broken desktop Today UI Ofer reported and added the controls he asked for, on `needle-next-master`. Commits `9e51974` (shell + theme + inline-subtasks) → `dd6082d` (Capture FAB pin) → this round (id-collision + Vite fixes + docs).
- **Root cause #1 — missing app shell:** the v2 `App.tsx` rendered `TodayBoardScreen` as a bare fragment, dropping the existing `.win > Titlebar > .body` shell. That one regression caused content under the macOS traffic lights, no scrolling (`.body` was `overflow:hidden`), unbounded width, and from-body window dragging. **Fix:** re-wrap in the shell; `.body` owns scroll; `.today-screen` is a centered **720px** reading column; titlebar left-inset 80px clears the traffic lights; the settings gear moved from a `position:fixed` overlay (it was covering the template switcher) into a titlebar control cluster.
- **Appearance control (Ofer chose: segmented, via AskUserQuestion):** new ☀/◐/☾ **light / system / dark** segmented control in the titlebar (`components/Window/AppearanceToggle.tsx`). Added a store `appearance` preference (`system|light|dark`); resolved `theme` stays binary; the `prefers-color-scheme` listener now only drives theme when `appearance === 'system'` (it previously clobbered manual choice). Persisted to `localStorage` (`needle.appearance`).
- **Capture FAB:** was `position:absolute` inside the now-scrolling `.body`, so it rode up with the page → changed to `position:fixed` (matches the floating Countdown). Verified live.
- **Inline subtasks (Ofer chose: keep top composer + add inline):** ui-web `ItemLine` got a hover **"+ subtask"** button, **⇧⏎** to start a subtask under an item / chain siblings in the composer, and an **AI-parse** toggle on the inline composer.
- **Root cause #2 — runtime id collision (real, pre-existing):** `uid()` (`model/ids.ts`) uses a module-level counter that resets to 0 on reload, so after loading persisted `TodayData`, `addItem`/`addChild` minted ids that **collided** with loaded ones → `childrenOf` resolved a new child to a *pre-existing* item (the "new subtask shows Boaz/hekk/blabla subtree" glitch) and SQLite rejected the save with `UNIQUE constraint v2_items.id`. **Fix:** `reserveIds()` + `reserveIdsFromData(data)` in ui-web, called by desktop `App.tsx` right after `getTodayData()`. Failing-first tests added (`model/__tests__/id-reservation.test.ts`); ui-web now **77 tests**.
- **Root cause #3 — Vite pre-bundled workspace deps (the afternoon's real time-sink):** Vite had pre-bundled `@needle/ui-web` into `node_modules/.vite/deps` (frozen since 05-31), so **none of today's ui-web source edits ran** in the desktop app (the +subtask button never appeared; ⇧⏎ no-op'd), and the fresh `reserveIdsFromData` import — a name absent from the stale bundle — **crashed the renderer to a blank screen**. typecheck/tests stayed green (they read source), which masked it. **Fix:** `optimizeDeps.exclude: ['@needle/ui-web','@needle/domain','@needle/contract']` in `apps/desktop/vite.renderer.config.ts` (serve workspace pkgs as live source) + clear `.vite`. **Documented** in `build-and-tooling.mdc`, `ui-web.mdc`, the `needle-debug-app-state` skill, and `CLAUDE.md` so this can't eat an afternoon again.
- **Verification:** ui-web 77 tests + all-workspace typecheck/lint green; app boots clean (no constraint/import errors); FAB-pin + live theme switch verified; Ofer confirmed the renderer renders after the Vite fix.
- **Open / deferred:** AI-on-subtasks only cleans the title for now (`addChild` takes a title only — applying parsed time/duration to a subtask is a deeper change); dev-tool overlays (DevClock, BuildDiagnostics) still sit over content *in dev* (already DEV-gated for prod).
