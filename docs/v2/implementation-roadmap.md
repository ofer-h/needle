# V2 Implementation Roadmap

This roadmap moves Needle from the current UI-state model to the v2 domain model without breaking the running app.

## Phase A - Architecture Lock

- Land v2 docs and `src/shared/domain-v2.ts`.
- Add `needle-domain-architecture` skill.
- Record the decision in project memory.

Done when typecheck/lint pass and the branch is pushed.

## Phase B - Store Adapter

Goal: keep Today UI working while changing the mock store shape.

- Introduce a domain fixture with `items`, `itemRelations`, `itemPlans`, `itemOccurrences`, `assignments`, and `actors`.
- Add selectors that produce the existing Today view model:
  - overdue rows
  - today rows
  - upcoming/stash rows
  - subtask progress
  - event rows
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

## Phase G - Web/Server Split

- Extract domain package only when the web app or server exists.
- Add server Postgres schema matching `docs/v2/data-model.md`.
- Add sync cursor/outbox once two clients can edit the same workspace.

## Stop Conditions

Stop and re-plan if:

- A UI feature needs a field not represented in `domain-v2`.
- A shared task cannot explain per-user state.
- A coach/AI action cannot be attributed to an actor.
- Any DB table needs workspace scope but lacks it.
- A flow/AI feature cannot explain whether it is guidance, observation, or user-approved action.
