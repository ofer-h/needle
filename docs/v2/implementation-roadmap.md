# V2 Implementation Roadmap

This roadmap moves Needle from the current UI-state model to the v2 domain model without breaking the running app.

For the broader platform path, see:

- `architecture-guidelines.md`
- `sync-access-observability.md`
- `multi-app-roadmap.md`

## Phase A - Architecture Lock

- Land v2 docs and `src/shared/domain-v2.ts`.
- Add `needle-domain-architecture` skill.
- Record the decision in project memory.

Done when typecheck/lint pass and the branch is pushed.

## Phase B - Store Adapter

Goal: keep Today UI working while changing the mock store shape.

- Introduce a domain fixture with `items`, `itemRelations`, `itemPlans`, `itemOccurrences`, `assignments`, `actors`, `rituals`, `interventions`, and `captureEntries`.
- Seed at least one example of each guidance concept so selectors and AI flows have realistic data to exercise:
  - one `Item` with `commitmentLevel = 'unmissable'` (a 1:1 meeting).
  - one `Ritual` with `trigger = before_occurrence` (-5 min) and a `fire_intervention(modal_capture)` action.
  - one materialized `ItemPlan` with `relativeTo = { occurrenceId, offsetMinutes: -5 }` for the generated prep task.
  - one scheduled `Intervention` linked to that occurrence + ritual.
  - one example `CaptureEntry` linked to a `TransitionEvent`.
- Add selectors that produce the existing Today view model:
  - overdue rows
  - today rows
  - upcoming/stash rows
  - subtask progress
  - event rows
- Add selectors that surface `pendingInterventions` per item and `activeInterventions` for the daily flow view, even before the UI renders them.
- Keep existing components mostly unchanged.

## Phase B2 - Daily Flow State

Goal: make "what should I focus on right now?" explicit.

- Add v2 fixture records for `FlowSession`, `FocusSession`, `TransitionEvent`, `Reflection`, and `Suggestion`.
- Add selectors for:
  - current focus item
  - next item
  - transition state
  - pending suggestions
- Keep the UI calm: one current-focus affordance, not a dashboard.

## Phase C - Subtasks As Child Items

- Remove `Task.subtasks`.
- Model prep subtasks as child task items.
- `SubtaskList` receives child item view models.
- Add child item creation through `item_relations`.

Status update:

- `v2_item_relations` now stores child links with `relation_type = 'contains'`.
- Adding, toggling, and removing subtasks writes child `v2_items` and relation rows through repository APIs.
- The renderer still receives `Task.subtasks` as a derived view field so the existing Today UI stays stable while persistence is v2-native.
- The Today renderer now supports child-item title/notes edits, explicit reorder controls, move-to-another-task, and promote-to-standalone actions without falling back to embedded durable subtask state.

Next:

- Move the renderer's expanded item detail state to v2-native item/relation selectors and stop exposing `Task.subtasks` outside the Today adapter.
- Replace explicit child-item buttons with true row-level drag semantics only after the v2 selector/state migration can support it honestly.

## Phase D - Relation Cleanup

- Remove display-only `Task.link`.
- Use `ItemRelation(type='prep_for')` for prep/event links.
- Render relation chips from relations.

## Phase E - Planning Cleanup

- Move `date`, `startTime`, `slotIndex`, and `slotOrder` out of task records and into `ItemPlan`.
- Keep event time in `ItemOccurrence`.
- Today timeline builds from plans + occurrences.

## Phase F - Persistence Spike

- Add a local SQLite proof with the v2 tables.
- Keep it behind a repository API.
- Do not mix SQL directly into React components.

Status update:

- `002_v2_planning_schema` adds the first v2 SQLite tables for workspaces, actors, sources, items, item plans, item occurrences, capture entries, and activity log.
- `db:create-planning-items` writes accepted AI capture blocks into v2 tables first.
- Today still renders the existing row model, but `getAllTasks()` and `getAllEvents()` are now v2 projections so persisted v2 items appear in the main UI.
- Fresh demo seeding creates v2 planning rows. Legacy `tasks`, `calendar_events`, and `capture_entries` are dropped by `003_drop_legacy_tables`; there is no backfill path because the local DB can be reset.
- `db:update-event`, `db:convert-event-to-task`, `db:update-subtask`, `db:move-subtask`, `db:promote-subtask`, and `db:nest-task` now let the Today UI mutate projected v2 rows instead of relying on renderer-only state.

Next:

- Replace Today's Zustand state with a v2 domain state plus selectors, then remove direct `Task` / `CalendarEvent` writes.

## Phase F2 - Local Backup And Diagnostics

- Add workspace export/import.
- Add local diagnostic bundle export.
- Add local-only usage events for core daily-flow metrics.
- Keep analytics opt-in and avoid sending task/reflection text anywhere.

## Phase G - Package Extraction

- Extract pure domain types/selectors/commands to a package only after the v2-shaped store is working.
- Keep the desktop app in place during the first package extraction.
- Add design-token package only when a second app or native surface begins.

## Phase H - Web/Server Split

- Extract domain package only when the web app or server exists.
- Add server Postgres schema matching `docs/v2/data-model.md`.
- Add sync cursor/outbox once two clients can edit the same workspace.

## Phase I - Multi-App Growth

- Add web app after the server can sync one personal workspace.
- Add Expo mobile after the daily loop, capture, and notification needs are stable enough to justify a second UI.
- Add coach/accountability surfaces as scoped web access before building a separate coach app.

## Stop Conditions

Stop and re-plan if:

- A UI feature needs a field not represented in `domain-v2`.
- A shared task cannot explain per-user state.
- A coach/AI action cannot be attributed to an actor.
- Any DB table needs workspace scope but lacks it.
- A flow/AI feature cannot explain whether it is guidance, observation, or user-approved action.
- A platform/repo move happens without a clean checkpoint, branch, and verification plan.
- A coach, partner, AI, or integration action cannot be explained as an actor-attributed operation.
