# Agent A — V2 Store Adapter
# Branch: agent/v2-store-adapter
# Model: claude-opus-4-5 (complex architecture work)

## Your mission
Implement Phase B of docs/v2/implementation-roadmap.md: the domain fixture and store adapter
that lets the existing Today UI read from v2-shaped state — WITHOUT breaking anything that works today.

## Read first (in order)
1. scripts/orchestration/KNOWLEDGE_PACK.md
2. src/shared/domain-v2.ts — the target model you are adapting TO
3. docs/v2/implementation-roadmap.md — Phase B spec
4. docs/v2/domain-model.md — domain concepts
5. docs/v2/data-model.md — table shapes
6. src/renderer/state/store.ts — current store (what you are adapting FROM)
7. src/renderer/state/store-v2.ts — stub v2 store (extend this)
8. src/renderer/state/selectors-v2.ts — stub selectors (implement these)
9. memory/context.md — full project state

## What to build

### Step 1: Domain fixture (src/renderer/state/fixture-v2.ts)
Create a rich mock dataset using v2 types from domain-v2.ts.
Must include at minimum:
- 1 Workspace, 1 User, 1 Actor
- 5+ Items: mix of tasks (flexible + fixed) and calendar events
  - At least 1 Item with commitmentLevel = 'unmissable' (a meeting)
  - At least 1 overdue item (date = yesterday)
  - At least 2 today items
  - At least 2 upcoming/future items
  - At least 1 unplanned item (no date)
- ItemRelations: at least 1 prep_for relation (linking a task to a meeting)
- ItemPlans: scheduling data for each item (replaces Task.slotIndex/slotOrder/date)
- ItemOccurrences: for all calendar events and fixed-time items
- 1 Ritual with trigger = before_occurrence, action = fire_intervention
- 1 scheduled Intervention linked to an occurrence + ritual
- 1 CaptureEntry linked to a TransitionEvent
- FlowSession, FocusSession stubs for daily flow state

### Step 2: Selectors (src/renderer/state/selectors-v2.ts)
Implement selectors that produce the SAME view model the current Today UI expects:
- selectOverdueTasks(state) → Task[]  (maps v2 Items to current Task shape)
- selectTodayItems(state) → (Task | CalendarEvent)[]  (ordered by time/slot)
- selectUpcomingItems(state) → Task[]  (future + unplanned)
- selectSubtaskProgress(state, itemId) → { done: number, total: number }
- selectPendingInterventions(state) → Intervention[]
- selectActiveFocusItem(state) → Item | null

The view model MUST be compatible with existing TaskRow, EventRow, ItemRow components.
Do NOT change component APIs. The adapter pattern goes in selectors only.

### Step 3: Store adapter (src/renderer/state/store-v2.ts)
Wire the fixture into a Zustand store using the selectors.
The store should:
- Load from fixture-v2.ts by default (same as current store loads from mock data)
- Export the same shape expected by TodayScreen.tsx
- Be importable as a drop-in for the current store (same hook names where possible)

### Step 4: Smoke test the wiring
- Import store-v2 in a new file: src/renderer/state/__tests__/selectors-v2.test.ts
- Write 5-10 assertions verifying selector output matches expected view model shapes
- Run typecheck + lint

## What NOT to do
- Do NOT change TodayScreen.tsx, TaskRow.tsx, EventRow.tsx, ItemRow.tsx
- Do NOT remove or break src/renderer/state/store.ts (keep it, swap later)
- Do NOT add new npm packages without checking package.json first
- Do NOT add inline styles

## Commit cadence
Commit after each step. Message format:
  agent/v2-store-adapter: add domain fixture with v2 types
  agent/v2-store-adapter: implement today/overdue/upcoming selectors
  agent/v2-store-adapter: wire v2 store adapter
  agent/v2-store-adapter: add selector smoke tests

## Done when
- [ ] fixture-v2.ts exists with rich mock data
- [ ] selectors-v2.ts has all 6 selectors implemented
- [ ] store-v2.ts exports Zustand store with v2 data
- [ ] npm run typecheck passes
- [ ] npm run lint passes
- [ ] Report written to scripts/orchestration/reports/agent-v2-store-adapter.md
