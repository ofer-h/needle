# Needle Forward Implementation Plan

Date: 2026-05-26
Driver: Ofer accepted AI recommendation
Source plan: `/Users/groot/.claude/plans/analize-this-project-the-spicy-hamming.md`

## Position

The Claude plan is solid as a strategic map. We will execute it with a tighter first pass: clean baseline, stabilize data types, preserve the current Today behavior, then add editing and planning features one step at a time.

Needle is currently a UI shell with a strong Today timeline, design tokens, reusable primitives, and Cursor rules/skills. It is not yet an everyday tool because items are not fully editable, dates are display strings instead of real scheduling data, Upcoming is placeholder content, Capture is still mock-heavy, and there is no persistence, AI, DB, or calendar integration yet.

## Decisions

- Edit UI: inline expansion first; anchored non-modal menu for secondary actions.
- Meetings: no checkbox; event state comes from wall-clock time.
- Vocabulary: use `Act` / `Remember` for buckets, `Anchor` / `Float` for UI scheduling language.
- TypeScript enums: keep `fixed` / `flexible` internally for now.
- Storybook tool: Ladle, after the core item components stabilize.
- Execution style: small steps with typecheck/lint after each step.

## Step 0 - Baseline Hygiene

Goal: future feature work starts from a clean verification floor.

- Fix current lint errors in `src/main/ipc/index.ts`.
- Fix current lint errors in `src/renderer/components/Capture/CaptureScreen.tsx`.
- Run `npm run typecheck`.
- Run `npm run lint`.

## Step 1 - Model Foundation

Goal: make dates real before building historical scroll or pre-planning.

- Add `docs/glossary.md` with the agreed vocabulary.
- Change item scheduling data from display strings to real dates:
  - `Task.date: string | null` as `YYYY-MM-DD` or unplanned.
  - `Task.dateLabel?: string` for UI copy like `yesterday`, `anytime`, `1 PM`.
  - `CalendarEvent.date: string` as `YYYY-MM-DD`.
  - `CalendarEvent.endTime?: string`.
- Add optional future fields without wiring every feature yet:
  - `subtasks?`
  - `notes?`
  - `leadTimeMins?`
  - `relations?`
  - `source?`
- Update mock data to span dates around today.
- Update `buildTimeline(tasks, events, forDate)` to filter by date.

## Step 2 - Unified Item Row

Goal: one row anatomy for tasks and events while preserving current UI.

- Add `ItemRow.tsx` for `kind: 'task' | 'event'`.
- Keep `TaskRow.tsx` and `EventRow.tsx` as compatibility wrappers during transition.
- Preserve current drag behavior for flexible tasks.
- Keep events non-checkable.
- Add tests or focused verification for timeline ordering and DnD slot calculation if behavior changes.

## Step 3 - Item Editing, Notes, And Subtasks

Goal: close the biggest PRD gap.

- Add `expandedItemId` store state with a single-expanded invariant.
- Add `ItemDetail.tsx` for raw input, AI reason, notes, subtasks, and quick actions.
- Add `SubtaskList.tsx`.
- Add `ItemMenu.tsx` using `@floating-ui/react`.
- Add store actions for notes, subtasks, lead time, expansion, and deletion.
- Add keyboard support: `Esc` collapse, `Cmd-E` expand focused row, `Cmd-D` open menu.

## Step 4 - Pre-Planning Stash

Goal: replace placeholder Upcoming with real unplaced/future work.

- Replace hardcoded `UPCOMING_PLACEHOLDER`.
- Rename `UpcomingFooter` to `PlanStash` when behavior changes.
- Treat `date === null` as stash/unplanned.
- Allow moving items into a future date before adding drag-to-day behavior.

## Step 5 - Clock And Event State

Goal: make Today feel alive without adding cognitive load.

- Add `useNow()` ticking every 60 seconds.
- Add a prominent clock to `TodayToolbar`.
- Derive event state: `upcoming`, `in-progress`, `past`.
- Style event state visually; do not add completion checkboxes to events.

## Step 6 - Multi-Day Historical Scroll

Goal: long-scroll day journal once the data model can support it.

- Introduce `DaySection`.
- Render date-keyed sections.
- Scope each day to its own DnD context.
- Start without virtualization; add `react-virtuoso` only after the plain implementation needs it.

## Step 7 - Ladle Stories

Goal: visual QA and design-system confidence.

- Install Ladle as a dev dependency.
- Add stories for primitives first.
- Add stories for `ItemRow`, `ItemDetail`, `SubtaskList`, `ItemMenu`, `PlanStash`, and `TodayToolbar`.
- Add a Foundations story that documents semantic token roles.

## Step 8 - Source And Relations

Goal: represent where an item came from and what it connects to.

- Add first-class `SourceId` and `Relation` types.
- Replace string `link` with structured relations.
- Add `SourceBadge` and `RelationChip` primitives.
- Keep source badge separate from task completion.

## Verification Cadence

Every step ends with:

- `npm run typecheck`
- `npm run lint`
- focused manual smoke if UI behavior changed
- docs or memory update if the step changes product direction

## Progress

### 2026-05-26

- Step 0 complete: baseline lint errors fixed.
- Step 1 foundation slice complete: glossary added, date utilities added, task/event dates are real ISO dates, row display labels moved to `dateLabel`, event `endTime` exists, optional future item metadata exists, mock data spans yesterday/today/tomorrow/in-three-days/unplanned, `buildTimeline()` can filter by date, and Upcoming now reads from store data.
- Step 2 complete: `ItemRow` added as the shared task/event row implementation; `TaskRow` and `EventRow` now remain as compatibility wrappers; current TodayScreen and DnD behavior are preserved.
- Step 3 first slice complete: `@floating-ui/react` installed; task rows expand inline; single-expanded state, notes, subtasks, lead time, bucket changes, date planning, and delete actions exist in the store; `ItemDetail`, `SubtaskList`, and `ItemMenu` are wired into `ItemRow`; Escape collapses details and Cmd-E expands the focused row.
- Removed the mock `Daily standup` task so the meeting appears only as a calendar event with no checkbox.
- Verified each completed slice with `npm run typecheck` and `npm run lint`; also smoke-tested against the already-running Electron app.
- Next step: harden Step 3 with focus-return polish, fuller keyboard menu controls, and manual Electron smoke before moving to Plan Stash.
