# Vertical Slice — 3 PM Meeting Scenario

**Status:** In progress
**Branch:** `codex-v2-architecture`
**Started:** 2026-05-26
**Owner:** Ofer

This is a living working doc. Update it at the end of every meaningful change. If a session is interrupted, the next session reads this top-to-bottom and resumes from the **Status pointer**.

---

## Goal

Build the first end-to-end product moment using the v2 contract: an unmissable 3 PM meeting, a pre-meeting capture ritual, a brain-dump surface, and a torchlight intervention that draws the user out of focus into the next commitment.

**Success criterion:** walking through the scenario in the running Electron app (with a simulated dev clock) and feeling whether the loop is calm but uncompromising. Each step writes through v2 store actions and produces correct `ActivityLog` entries.

---

## Status pointer

▸ **Steps 5 + 6 next** — modal capture + torchlight overlay (run in parallel).

(When resuming: update this line first, before doing any other work.)

### Progress log

- 2026-05-26 — Steps 1-4 complete (planning doc, store + fixture, selectors, dev clock).
  - `src/renderer/state/store-v2.ts` — fixture + actions; clean typecheck + lint.
  - `src/renderer/state/selectors-v2.ts` — `selectTodayItems` / `selectActiveInterventions` / `selectDailyFlow` / `selectPendingCaptureEntries`. Handles `relativeTo` derived timing.
  - `src/renderer/utils/dev-clock.ts` — zustand-based frozen-time singleton; `nowIso()` reads frozen or real.
  - `src/renderer/components/DevTools/DevClockControl.tsx` — floating preset jumper (14:54 / 14:55 / 14:59 / 15:00 / 15:01 + resume).
  - Not yet mounted in `App.tsx` / `TodayScreen.tsx` — wiring deferred to Step 7.

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

- (none yet)

---

## Resume instructions

If this session is interrupted, the next session should:

1. Read this file top to bottom.
2. Look at the **Status pointer** line — that is the next concrete action.
3. Read `src/shared/domain-v2.ts` for the contract.
4. Read whichever step files were last touched (`git status`).
5. Continue from the marked step.
6. Update the Status pointer before doing other work.
