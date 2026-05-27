## Summary

Phase B store adapter is implemented on `agent/v2-store-adapter`. V2 domain data lives in `fixture-v2.ts`; `selectors-v2.ts` maps it to the legacy `Task` / `CalendarEvent` shapes TodayScreen already uses. `store-v2.ts` loads the fixture; `useAppStoreV2` in `store-v2-today-adapter.ts` is the drop-in hook (swap import from `store` when ready). TodayScreen, TaskRow, EventRow, and ItemRow were not changed.

## Files changed

| File | Change |
|------|--------|
| `src/renderer/state/fixture-v2.ts` | New rich v2 mock: workspace, actors, 9 top-level tasks, 2 events, plans, occurrences, prep_for, contains subtasks, ritual, interventions, capture+transition, flow/focus sessions |
| `src/renderer/state/selectors-v2.ts` | Adapter selectors (`selectOverdueTasks`, `selectTodayItems`, etc.) + `selectTodayViewModel`; flow selectors renamed to `selectTodayItemViews` |
| `src/renderer/state/store-v2.ts` | Initializes from `createV2Fixture()`; exports `SEED_IDS`, `selectTodayViewModel` |
| `src/renderer/state/store-v2-today-adapter.ts` | `useAppStoreV2` — same surface as `useAppStore` for Today UI |
| `src/renderer/state/__tests__/selectors-v2.test.ts` | 9 smoke tests for adapter output |
| `vitest.config.ts` | Include `src/renderer/**/*.test.ts` |

## Typecheck result

- `npx tsc -p tsconfig.renderer.json --noEmit` on **state/** files: clean
- Full `npm run typecheck`: fails on unrelated WIP (`Capture/ApiKeySettings.tsx` untracked from parallel agent work on this machine)

## Lint result

- `eslint src/renderer/state/`: clean
- Full `npm run lint`: pre-existing errors in `BrainDumpPanel.tsx`, `window.d.ts` (not introduced here)

## Test result

```
npm test -- --run
Test Files  1 passed (1)
Tests       9 passed (9)
```

## Decisions made

- Kept v2-native `selectTodayItemViews` / `selectDailyFlow` alongside adapter selectors (InterventionLayer still uses raw `useV2Store`).
- Child tasks modeled via `contains` relations; adapter maps them to `Task.subtasks` until Phase C.
- `useAppStoreV2` mutates underlying v2 entities then recomputes `tasks`/`events` — read path is the Phase B goal; full parity on `setNotes`/`setLeadTime` deferred.

## What's left / known gaps

- TodayScreen still imports `useAppStore` from `store.ts` — swap to `useAppStoreV2` when validating in app.
- Notes and lead-time edits in the adapter are no-ops (v2 uses `Item.body` / `ItemPlan.relativeTo`).
- Full-repo typecheck blocked by unrelated capture/API WIP in the worktree.

## Blockers

None for Phase B scope. Full `npm run typecheck` needs a clean worktree without parallel agent capture changes.

## Commits

| SHA | Message |
|-----|---------|
| `d45b47d` | agent/v2-store-adapter: add domain fixture with v2 types |
| `58db483` | agent/v2-store-adapter: implement today/overdue/upcoming selectors |
| `b485f25` | agent/v2-store-adapter: wire v2 store adapter to fixture |
| `e0099fb` | agent/v2-store-adapter: add selector smoke tests |
