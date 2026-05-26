# Vertical Slice — 3 PM Meeting Scenario

**Status:** Implementation complete; user verification blocked on env restart.
**Branch:** `codex-v2-architecture`
**Started:** 2026-05-26
**Owner:** Ofer

This is a living working doc. Update it at the end of every meaningful change. If a session is interrupted, the next session reads this top-to-bottom and resumes from the **Status pointer**.

## TL;DR — where everything lives

| Topic | File |
|---|---|
| **This plan + status pointer + troubleshooting** | `docs/v2/vertical-slice-3pm-meeting.md` (this file) |
| Architecture north star | `docs/v2/product-direction.md` |
| Domain concepts (Item, Intervention, Ritual, CaptureEntry, etc.) | `docs/v2/domain-model.md` |
| Database tables | `docs/v2/data-model.md` |
| Multi-app roadmap (rings 0→7) | `docs/v2/multi-app-roadmap.md` |
| Implementation phases (A→I) | `docs/v2/implementation-roadmap.md` |
| Shared TypeScript contract | `src/shared/domain-v2.ts` |
| v2 store + seeded fixture | `src/renderer/state/store-v2.ts` |
| v2 selectors | `src/renderer/state/selectors-v2.ts` |
| Dev clock + control | `src/renderer/utils/dev-clock.ts`, `src/renderer/components/DevTools/DevClockControl.tsx` |
| InterventionLayer (router + IPC) | `src/renderer/components/Intervention/InterventionLayer.tsx` |
| Torch (system-level, separate window) | `src/main/windows/torch.ts`, `src/renderer/components/Intervention/TorchWindow.tsx`, `Torchlight.tsx` |
| Brain-dump capture (separate window) | `src/main/windows/capture.ts`, `src/renderer/components/Intervention/CaptureWindow.tsx` |
| Escalation banner (in-app) | `src/renderer/components/Intervention/EscalatedBanner.tsx` |
| IPC contracts | `src/shared/ipc-contracts.ts` |
| Preload + window typing | `src/preload/index.ts`, `src/renderer/window.d.ts` |
| Main process bootstrap | `src/main/index.ts`, `src/main/ipc/index.ts`, `src/main/windows/main.ts` |

## What's done

1. **v2 contract** (`src/shared/domain-v2.ts`) — full domain types incl. `Intervention`, `Ritual`, `CaptureEntry`, `Item.commitmentLevel`, `ItemPlan.relativeTo`. Shipped in commit `7d507db`.
2. **v2 store + fixture** (`src/renderer/state/store-v2.ts`) — seeded with the 3 PM 1:1 scenario: workspace, actors, sources, unmissable event item, ritual, prep task with `relativeTo` plan, three chained interventions (capture, torch, escalation). Activity log entries on every mutation.
3. **v2 selectors** (`src/renderer/state/selectors-v2.ts`) — `selectTodayItems`, `selectActiveInterventions`, `selectDailyFlow`, `selectPendingCaptureEntries`. Handles `relativeTo` derived timing.
4. **Dev clock** (`src/renderer/utils/dev-clock.ts` + `DevClockControl.tsx`) — bottom-right control with presets 14:54 / 14:55 / 14:59 / 15:00 / 15:01 + "resume" to return to real time.
5. **Brain-dump capture** — standalone Electron BrowserWindow (`src/main/windows/capture.ts` + `src/renderer/components/Intervention/CaptureWindow.tsx`). 600x480, always-on-top floating, visible across all macOS spaces.
6. **System torch** — full-screen Electron BrowserWindow (`src/main/windows/torch.ts` + `src/renderer/components/Intervention/TorchWindow.tsx`). Covers primary display, all spaces incl. over full-screen apps, cursor-tracking spotlight.
7. **Escalation banner** (`EscalatedBanner.tsx`) — top-banner stand-in for what would be a push notification.
8. **InterventionLayer** (`InterventionLayer.tsx`) — reads v2 store + dev clock, auto-activates scheduled-but-due interventions, routes the highest-intensity one to the right surface via IPC. Listens for close events and updates the store.
9. **Removed**: debug-only `V2TodayIsland` + the in-window `ModalCapture` (superseded by the standalone window).

## What's open

1. **Step 8 — user verification.** Walk the scenario, report what you see and feel. **Blocked**: requires a full app restart to pick up new main-process + preload code (see Troubleshooting).
2. **Open product questions** logged at the bottom — auto-resolve capture when preempted by torch, mouse-capture vs click-through for torch, escalation timer trigger, etc.
3. **Future** (not in this slice): multi-display torch, real push for escalation, real calendar sync, multi-actor, SQLite persistence, AI-suggested rituals, mouse-as-flashlight across other apps with click-through.

---

## Goal

Build the first end-to-end product moment using the v2 contract: an unmissable 3 PM meeting, a pre-meeting capture ritual, a brain-dump surface, and a torchlight intervention that draws the user out of focus into the next commitment.

**Success criterion:** walking through the scenario in the running Electron app (with a simulated dev clock) and feeling whether the loop is calm but uncompromising. Each step writes through v2 store actions and produces correct `ActivityLog` entries.

---

## Status pointer

▸ **Blocked on verification.** User reports clicking the dev clock preset (e.g. 14:59) produces no visible change — torch window does not appear. Almost certainly a stale-process issue (see Troubleshooting below). Next step is for the user to fully Cmd-Q the app, `npm start` fresh, open DevTools (Cmd+Option+I), click the preset, and report what they see in the console.

(When resuming: update this line first, before doing any other work.)

## Troubleshooting (added 2026-05-26)

### Symptom: clicking a dev-clock preset does nothing

**Most likely cause:** Electron main-process and preload code are loaded only at startup. Vite's hot-reload covers the renderer but NOT the main process and NOT the preload. If `npm start` was running before commits `7d507db` (intervention contracts), `ed22b05` (v2 store), `4566c61` (in-window slice), `d59caa7` (system torch), or `dc172a7` (capture window), then the running Electron has old main + old preload code. The renderer can call `window.api.torch.show(...)` but main has no handler, OR `window.api.torch` is undefined entirely because preload didn't expose it.

**Fix:**
1. Cmd-Q the app (fully quit, not just close the window).
2. From `/Users/groot/dev/needle`, run `npm start` again.
3. Open DevTools (View → Developer → Toggle Developer Tools, or Cmd+Option+I).
4. Click the **14:59** preset on the dev clock (bottom-right).
5. If nothing happens, check the console for errors and paste them.

### Quick manual sanity check

In DevTools console:

```js
window.api?.torch?.show({ correlationId: 'manual-test', title: 'TEST', subtitle: 'manual', durationMs: 5000 });
```

- If the torch overlay appears: the IPC + window plumbing works, the bug is in InterventionLayer's activation logic.
- If `window.api` or `window.api.torch` is `undefined`: preload is stale or didn't load.
- If the call returns but no window opens: main-process IPC handler is missing (stale main).

Same for capture:

```js
window.api?.capture?.show({ correlationId: 'manual-test', title: 'TEST', subtitle: 'manual' });
```

### Step 9 — System-level torch (added 2026-05-26, done)

User feedback after Step 7: the torch must be a full-system overlay, not just inside the main window. Wherever the user is on their mac, the torch appears.

Implemented:

- `src/main/windows/torch.ts` — `showTorch(payload)` opens a transparent, frameless BrowserWindow covering the primary display's bounds. `alwaysOnTop('screen-saver')`, `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`, `skipTaskbar`, `fullscreenable: false`. Loads the renderer with `?mode=torch`.
- `src/main/ipc/index.ts` — handlers for `torch:show`, `torch:hide`, `torch:dismiss`. The dismiss handler forwards `torch:closed` to the main-app window and closes the torch window.
- `src/shared/ipc-contracts.ts` — `TorchShowPayload`, `TorchDismissReason`, `TorchClosePayload` types with a `correlationId` so the main-app renderer can match the close back to the originating intervention.
- `src/preload/index.ts` + `src/renderer/window.d.ts` — `window.api.torch.{show, hide, dismiss, onPayload, onClosed}`.
- `src/renderer/main.tsx` — checks `?mode=torch` query, mounts either `<App />` or `<TorchWindow />`. Adds `body.torch-mode` class so torch-only CSS doesn't leak into the main app.
- `src/renderer/components/Intervention/TorchWindow.tsx` + `.css` — full-window component that listens for `torch:payload`, tracks `mousemove`, renders `Torchlight` with a cursor-driven spotlight. Cursor IS the torch.
- `Torchlight.tsx` extended — added `cursor?: { x, y, radius }` prop, `showCta`, `timeoutMs`. In cursor mode the spotlight follows the mouse via inline mask updates.
- `InterventionLayer.tsx` rewritten — for `attention_takeover_torch`, fires `window.api.torch.show()` (an effect tracks the active torch id and hides on transition). Listens for `torch:closed` and routes to `resolveIntervention` (acknowledged) or `escalateIntervention` (timeout).

Architectural notes:

- Mouse is captured by the torch window (not click-through). The user cannot interact with apps underneath until they dismiss. Trade-off: "uncompromising attention" vs "cursor-following-everywhere distraction." Acceptable for the first cut.
- Primary display only. Multi-display extension is a follow-up: iterate `screen.getAllDisplays()` and open a torch window per display, share the same correlationId, dismiss all on first acknowledge.
- The CSS for torch transparency is scoped by `body.torch-mode` so the main window keeps its normal opaque background.
- Vite verified to bundle main + preload + renderer cleanly.

### Step 10 — Brain-dump capture as standalone always-on-top window (done)

User feedback after Step 7: the in-window modal capture should also be a standalone always-on-top window, like the torch. Plus: the debug "v2 slice" island below QuickAdd was confusing and is not product UI — removed.

Implemented:

- `src/main/windows/capture.ts` — `showCapture(payload)` opens a transparent, frameless, 600x480 BrowserWindow centered horizontally and one-third down on the primary display. `alwaysOnTop('floating')`, visible on all workspaces incl. full-screen, `skipTaskbar`, `focusable: true` (so the textarea can receive keystrokes). Loads renderer with `?mode=capture`.
- `src/main/ipc/index.ts` — handlers for `capture:show`, `capture:hide`, `capture:add-entry`, `capture:promote-entry`, `capture:dismiss-entry`, `capture:close`. All forwarded to the main-app window for store updates.
- `src/shared/ipc-contracts.ts` — capture payload types with a `correlationId` that pairs every event back to the originating intervention.
- `src/preload/index.ts` + `src/renderer/window.d.ts` — `window.api.capture.{show, hide, addEntry, promoteEntry, dismissEntry, close, onPayload, onEntryAdded, onEntryPromoted, onEntryDismissed, onClosed}`.
- `src/renderer/main.tsx` — `?mode=capture` routes to `<CaptureWindow />`. Sets `body.capture-mode` so capture-only CSS does not leak.
- `src/renderer/components/Intervention/CaptureWindow.tsx` + `.css` — full-window component with a local entry list (raw / promoted / dismissed). Emits IPC for each user action.
- `InterventionLayer.tsx` updated — for `modal_capture`, fires `window.api.capture.show(...)`. Listens for capture entry events and routes them to v2 store actions (`addCaptureEntry`, `promoteCaptureEntry`, `dismissCaptureEntry`). On close, calls `resolveIntervention` with the right outcome.
- Removed `ModalCapture.tsx` + `.css` — no longer used.
- Removed `V2TodayIsland.tsx` + `.css` — was a debug surface; not product UI.

Architectural notes:

- The capture window is sized to the card itself, so clicking outside the window naturally uses other apps — no click-through magic needed.
- State authority stays in the main-app renderer (the v2 store). The capture window holds local-only entry state for its own UI; canonical writes happen in the main window via IPC.
- A small map (`entryIdMap`) in InterventionLayer translates the capture window's local entry ids into the v2 store's `CaptureEntryId`s, so promote/dismiss reach the right rows.

Architecture:
- New Electron BrowserWindow created on demand by main process.
- Properties: `transparent: true`, `frame: false`, `alwaysOnTop` at `'screen-saver'` level, `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`, `skipTaskbar: true`, `fullscreenable: false`, `focusable: true`, `resizable: false`, covers the primary display's full bounds.
- Mouse is captured (NOT click-through). The user cannot interact with other apps until they dismiss. That is the "take the user's attention" experience.
- Cursor IS the torch — spotlight follows `mousemove` on the overlay. Matches the user's original brainstorm.
- 30s timer fires `escalateIntervention` if the user does not dismiss.
- Single primary display for v1; multi-display TODO.

Reuses the existing renderer bundle with a `?mode=torch` URL flag — `src/renderer/main.tsx` checks the query string and mounts either `<App />` or `<TorchWindow />`. No new Vite entry needed.

New IPC channels (`src/shared/ipc-contracts.ts`):
- `torch:show` (renderer → main): `{ title, subtitle, durationMs }` — open the window.
- `torch:hide` (renderer → main): force-close (e.g. when the source intervention is cancelled).
- `torch:payload` (main → torch renderer): pushes title/subtitle/durationMs into the torch window after it loads.
- `torch:dismiss` (torch renderer → main): user clicked CTA OR the timer elapsed. Reason: `'acknowledged' | 'timeout'`.
- `torch:closed` (main → main-app renderer): forwarded after the torch window closes, so InterventionLayer can call `resolveIntervention` / `escalateIntervention`.

### Progress log

- 2026-05-26 — Steps 1-4 complete (planning doc, store + fixture, selectors, dev clock).
  - `src/renderer/state/store-v2.ts` — fixture + actions; clean typecheck + lint.
  - `src/renderer/state/selectors-v2.ts` — `selectTodayItems` / `selectActiveInterventions` / `selectDailyFlow` / `selectPendingCaptureEntries`. Handles `relativeTo` derived timing.
  - `src/renderer/utils/dev-clock.ts` — zustand-based frozen-time singleton; `nowIso()` reads frozen or real.
  - `src/renderer/components/DevTools/DevClockControl.tsx` — floating preset jumper (14:54 / 14:55 / 14:59 / 15:00 / 15:01 + resume).
  - Not yet mounted in `App.tsx` / `TodayScreen.tsx` — wiring deferred to Step 7.
  - Committed as `ed22b05`.
- 2026-05-26 — Step 5 complete (modal capture).
  - `src/renderer/components/Intervention/ModalCapture.tsx` + `.css` — props are `{ intervention, entries, onClose }`; uses `useV2Store` for `addCaptureEntry` / `promoteCaptureEntry` / `dismissCaptureEntry` / `resolveIntervention`. Cmd/Ctrl+Enter commits a draft. Closing with entries records `completed`; closing empty records `dismissed`. Locks body scroll while open.
  - Typecheck + lint clean.
- 2026-05-26 — Step 6 complete (torchlight overlay, via background subagent).
  - `src/renderer/components/Intervention/Torchlight.tsx` + `.css` — self-contained, no store dependency.
  - Decision the agent made: `mask-image` + radial-gradient on a single backdrop element (not SVG, not clip-path). Reason: masked-out regions render nothing — neither dim nor blur leaks into the spotlight. Mask transitions get smooth slide for free.
  - Spotlight follows `targetRect`: center on rect, radius = `max(w,h) * 0.8 + 60`. Falls back to viewport center @ 200px when null.
  - 30s auto-timeout via `useRef` to avoid resetting the timer on callback identity changes.
  - `prefers-reduced-motion` disables transitions.
  - Concerns flagged: no portal — parent must mount near root or a transformed ancestor will break z-index escape (handled in Step 7: mounted in App.tsx).
- 2026-05-26 — Token migration patch.
  - The new components referenced `--surface-raised` / `--border-subtle` / `--surface-hover` / `--border-default` which were target names in `design/tokens.md` but not yet defined.
  - Added them as aliases in `src/renderer/styles/tokens.css` for both light and dark themes (mapped per the migration table in `design/tokens.md`).
  - Fixed token names in `DevClockControl.css` and `ModalCapture.css` to use the project's step-based scale (`--space-3`, `--text-13`, `--radius-3` etc.) instead of pixel-named tokens.
- 2026-05-26 — Step 7 complete (wiring).
  - `src/renderer/components/Intervention/InterventionLayer.tsx` — reads `useV2Store` + `useDevClock`, derives surfacing interventions (active OR scheduled-but-due), auto-activates the scheduled-but-due ones via `useEffect`, routes the highest-intensity one to the right component by strategy. Re-measures the torch's target rect on resize/scroll/500ms interval.
  - `src/renderer/components/Intervention/EscalatedBanner.tsx` + `.css` — top banner stand-in for what would be a push notification.
  - `src/renderer/components/Intervention/V2TodayIsland.tsx` + `.css` — renders the v2 prep + meeting items so the torch has a DOM target (`data-v2-item-id`). Also shows captured-but-unpromoted entries inline.
  - Mounted `<InterventionLayer />` and `<DevClockControl />` in `App.tsx` (top-level, no transformed ancestors).
  - Mounted `<V2TodayIsland />` inside `TodayScreen` between QuickAddRow and UpcomingFooter.
  - Typecheck + lint clean.

### Dry-run trace (what should happen)

| Clock | Surfacing | Renders | Side effects |
|---|---|---|---|
| live (not jumped) | none | dev clock + v2 island only | — |
| 14:54 | none | same | — |
| 14:55 | capture (was scheduled) | ModalCapture | `activateIntervention` runs, status=active. User types thoughts → `addCaptureEntry`. "Promote to task" → new `Item`. "Done" → `resolveIntervention(outcome='completed')`. |
| 14:59 | torch (now due) | Torchlight pointing at Manager 1:1 row | `activateIntervention(torch)`. User clicks CTA → `resolveIntervention(outcome='acknowledged')`. If no click for 30s → `escalateIntervention` activates the chained `escalated_alert`. |
| 15:00 (no ack) | escalation | EscalatedBanner | User dismisses → `resolveIntervention(outcome='acknowledged')`. |

Every transition writes `ActivityLog` rows attributed to the correct actor (user vs system).

---

## Scope

### In

- v2 store + fixture seeding the 3 PM meeting scenario.
- Selectors that produce `TodayItemView[]` + `DailyFlowView` with `activeInterventions`.
- Simulated dev clock (jump to 14:54, 14:55, 14:59, 15:00, 15:01).
- Modal capture surface — fires from `modal_capture` intervention, writes `CaptureEntry[]`.
- Torchlight overlay — fires from `attention_takeover_torch` intervention, dim/blur + spotlight on next item.
- Store actions: `scheduleIntervention`, `activateIntervention`, `resolveIntervention`, `escalateIntervention`, `addCaptureEntry`, `promoteCaptureEntry`.
- Acknowledge / dismiss flow → `InterventionOutcome` recorded.
- `ActivityLog` entries for every guidance-related write.

### Out (deferred)

- Real calendar sync (use manual seeded `ItemOccurrence`).
- Real system notifications / push (in-app surface only this slice).
- AI-suggested rituals (manual ritual only; AI suggestion flow comes later).
- Subtasks-as-child-items migration (Phase C, separate slice).
- Multi-actor / sharing.
- Persistence to SQLite (still in-memory fixture; Ring 1 work).
- Mouse-as-flashlight tracking (v1 torchlight uses fixed spotlight over target item).

---

## Decisions locked

| Decision | Rationale |
|---|---|
| Vertical-slice approach over bottom-up Phase B | Velocity + learning whether the loop feels right; data model is solid enough to commit. |
| Slice reads/writes through v2 selectors and actions only | Avoids throwaway work; remaining Today rows port to the same selectors later. |
| Rest of Today UI keeps legacy `Task` store for now | Slice is additive, not a migration. |
| Simulated dev clock for development | Real `useNow()` hook comes after the loop is validated. |
| Torchlight = CSS radial-gradient spotlight + backdrop dim/blur | Standard CSS, no mouse-tracking in v1. |
| Spotlight follows the target item card via DOMRect ref | Predictable + accessible; mouse-as-flashlight is a v2 enhancement. |
| Modal capture is non-blocking but unmissable-aware | Closing without input records `dismissed` outcome on the intervention. |
| Escalation in this slice = in-app banner | Real push needs device registration; deferred. |

---

## Step-by-step plan

### Step 1 — Planning doc — DONE
This file. Living doc, updated per step.

### Step 2 — v2 fixture + store skeleton — NEXT
- New file: `src/renderer/state/store-v2.ts`.
- Seeds:
  - One `Workspace`, one `User`, one `Actor(kind='user')` for Ofer, one `Actor(kind='ai_agent')`, one `Actor(kind='integration')` for calendar.
  - One `Source(kind='manual')`, one `Source(kind='calendar')`.
  - 3 PM 1:1 `Item(kind='event', commitmentLevel='unmissable')` + matching `ItemOccurrence`.
  - One `Ritual(kind='pre_meeting_capture')`, trigger `before_occurrence -5 min`, actions `[open_capture, fire_intervention(attention_takeover_torch, screen_overlay, intensity=4, offsetMinutes=-1)]`.
  - Materialized prep `Item(kind='task')` + `ItemRelation(prep_for)` + `ItemPlan(mode='anchor', relativeTo={occ, -5})`.
  - Two scheduled `Intervention` rows: modal_capture at 14:55, torch at 14:59.
- Branded ID helpers (factory functions that mint UUIDs).
- Store actions stubbed:
  - `scheduleIntervention(input)` → adds + `activity_log`.
  - `activateIntervention(id)` → status=active, activatedAt=now.
  - `resolveIntervention(id, outcome)` → status, outcome, resolvedAt, `activity_log`.
  - `escalateIntervention(id)` → sets `escalatesToInterventionId`, fires the next.
  - `addCaptureEntry(input)` → adds + `activity_log`.
  - `promoteCaptureEntry(id)` → creates `Item(kind='task')`, sets entry.status=`promoted` + promotedItemId, `activity_log`.
- Verify: typecheck passes; fixture exports a non-empty initial state.

### Step 3 — v2 selectors
- New file: `src/renderer/state/selectors-v2.ts`.
- `selectTodayItems(state, actorId, date, now)` → `TodayItemView[]` including resolved-time for `relativeTo` plans, `pendingInterventions` per item, child progress.
- `selectActiveInterventions(state, actorId, now)` → `Intervention[]` where `status === 'scheduled' && scheduledFor <= now` OR `status === 'active'`.
- `selectPendingCaptureEntries(state, actorId)` → `CaptureEntry[]` where `status === 'raw'`.
- `selectDailyFlow(state, actorId, date, now)` → `DailyFlowView`.
- Verify with dev-mode logs at simulated times 14:54 (no intervention), 14:55 (modal_capture active), 14:59 (torch active), 15:01 (resolved or missed).

### Step 4 — Simulated dev clock
- New util: `src/renderer/utils/dev-clock.ts` — singleton with `now()` that returns either real `Date.now()` or a frozen scrubbable time.
- Floating dev control: "Jump to 14:54 / 14:55 / 14:59 / 15:00 / 15:01" + "Resume real time".
- Visible only when an env flag or dev-menu toggle is on.

### Step 5 — Modal capture surface — PARALLELIZABLE WITH STEP 6
- New components: `src/renderer/components/Intervention/ModalCapture.tsx` + CSS.
- Renders when `activeIntervention.strategy === 'modal_capture'`.
- Multiline input → on submit → `store.addCaptureEntry(body)`; chip list of previous entries; "Promote to task" per chip → `store.promoteCaptureEntry(id)`.
- Close button → `store.resolveIntervention(id, entries > 0 ? 'completed' : 'dismissed')`.
- Calm visual: subtle scrim, centered card, no urgency markers.

### Step 6 — Torchlight overlay surface — PARALLELIZABLE WITH STEP 5
- New components: `src/renderer/components/Intervention/Torchlight.tsx` + CSS.
- API (self-contained, no store dependency):
  ```ts
  type Props = {
    active: boolean;
    title: string;
    subtitle: string;
    targetRect: DOMRect | null;  // where the spotlight goes
    onAcknowledge: () => void;
    onTimeout: () => void;        // fires after 30s without acknowledge
  };
  ```
- Full-screen fixed overlay; dim/blur backdrop via CSS `backdrop-filter`; radial-gradient spotlight positioned over `targetRect`.
- Single CTA "I'm moving to it" → `onAcknowledge()`.
- 30s timer → `onTimeout()` if no ack.

### Step 7 — Wire InterventionLayer into TodayScreen
- New: `src/renderer/components/Intervention/InterventionLayer.tsx` — picks the right component by `intervention.strategy`.
- `TodayScreen` reads `selectDailyFlow(...)`, mounts `<InterventionLayer />` at the top.
- Target rect for torch is captured by giving the target item card a ref-forwarding wrapper.

### Step 8 — End-to-end walk-through
- Run the app. Step the simulated clock through 14:54 → 14:55 → 14:59 → 15:00 → 15:01.
- Verify:
  - 14:54: no intervention active.
  - 14:55: modal capture fires; entries can be added + promoted.
  - 14:59: torch fires (capture already resolved or still open?  — decide UX during walk-through).
  - 15:00: if not acknowledged, status becomes `escalated`; next intervention (in-app banner stand-in for push) fires.
  - 15:01: meeting is in-progress; remaining interventions cancel.
- Take screenshots / notes per surface.

### Step 9 — Activity log spot-check
- After the walk-through, dump every `ActivityLog` row written. Confirm each guidance-related action has `actorId`, before/after, and a sensible `action` verb.

### Step 10 — Wrap
- Update `docs/v2/implementation-roadmap.md` Phase B note: vertical slice complete, fixture pattern proven.
- Update this doc's Status pointer to "Complete".
- Commit incrementally; PR or push at end.

---

## Parallel orchestration plan

Where work is genuinely independent and the subagent's cold-start cost is amortized by parallelism:

**Steps 5 (modal capture) + 6 (torchlight)** run in parallel once Step 4 is done.

- **Subagent A — Torchlight overlay.** Self-contained presentational component with the API in Step 6. No knowledge of the data model required. Tight brief: build component + CSS + a small demo page that exercises the API.
- **Main thread — Modal capture.** Needs the v2 store to write `CaptureEntry`s and resolve interventions, so it stays on the main thread.

**Merge point:** Step 7. Main thread wires both components into `InterventionLayer` and connects them to the store.

Other steps are tightly sequential (fixture → selectors → wiring) and not worth splitting.

---

## Open questions

Captured as they arise; resolved before they block.

- If the user doesn't resolve the modal capture before 14:59, the torch (higher intensity) preempts it visually. The capture intervention stays `status='active'` in the store — should it auto-resolve to `dismissed`/`completed` when preempted? Acceptable wart for the slice; revisit after the user walks through the scenario.
- The V2 island subscribes to the whole v2 store (no selector). Re-renders on every store change. Fine for the slice; tune with selectors when the v2 store fans out.
- The InterventionLayer activates scheduled-but-due interventions inside a `useEffect`. If multiple slice scenarios run in real-time (not frozen), the effect re-runs as `now` ticks. The early-return on empty `scheduledDueIds` keeps it harmless. Real-time ticking is not part of this slice — `useNow` integration is later.

---

## Resume instructions

If this session is interrupted, the next session should:

1. Read this file top to bottom.
2. Look at the **Status pointer** line — that is the next concrete action.
3. Read `src/shared/domain-v2.ts` for the contract.
4. Read whichever step files were last touched (`git status`).
5. Continue from the marked step.
6. Update the Status pointer before doing other work.
