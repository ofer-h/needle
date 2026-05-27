## Summary

**Status: done** (persistence layer + IPC bridge). Renderer still uses in-memory Zustand until Agent A wires `window.api.db`.

Phase F local SQLite persistence is implemented in the Electron main process: `better-sqlite3` at `userData/needle.db`, versioned migrations, typed repository, eight `db:*` IPC handlers, preload bindings, and first-launch seed from the legacy mock tasks/events.

## Files changed

| File | Change |
|------|--------|
| `package.json` / `package-lock.json` | Added `better-sqlite3`, `@types/better-sqlite3`, `vitest` |
| `vite.main.config.ts` | Externalize `better-sqlite3` for native binding |
| `vitest.config.ts` | Main-process unit tests |
| `src/main/db/index.ts` | `open` / `getDb` / `close` |
| `src/main/db/paths.ts` | Resolve `needle.db` under `userData` with path guard |
| `src/main/db/migrations/*` | `001_initial_schema` + runner |
| `src/main/db/repository.ts` | Task / event / capture CRUD |
| `src/main/db/seed-data.ts` | Mock tasks/events (mirrors `store.ts`) |
| `src/main/db/seed.ts` | `seedIfEmpty` on bootstrap |
| `src/main/db/__tests__/*` | Repository + paths smoke tests |
| `src/main/ipc/db-handlers.ts` | IPC validation + repository dispatch |
| `src/main/ipc/index.ts` | Register `registerDbHandlers()` |
| `src/main/index.ts` | Open DB, seed, close on quit |
| `src/shared/types.ts` | `CaptureEntry` type for persistence IPC |
| `src/shared/ipc-contracts.ts` | Eight `db:*` channel contracts |
| `src/preload/index.ts` | `window.api.db` bridge |
| `src/renderer/window.d.ts` | Typed `db` API on `Window` |

## Typecheck result

- `tsc -p tsconfig.main.json` — **pass**
- `tsc -p tsconfig.preload.json` — **pass**
- `npm run typecheck` (includes renderer) — **fail** on this workspace due to in-progress Agent A v2 selector/adapter files (`selectors-v2.ts`, `store-v2-today-adapter.ts`, tests), not introduced by this branch’s committed diff.

## Lint result

- `eslint` on touched main/preload/shared/window.d.ts paths — **pass**
- Full `npm run lint` — **fail** on unrelated renderer files (Capture WIP, fixture-v2) in the working tree.

## Test result

- `npm test -- --run` — **pass** (5 tests: task CRUD, events, disk persist, path guard)

## Decisions made

- Store full v1 `Task` shape (including `scheduleKind`, relations JSON, etc.) so mock seed round-trips without loss.
- Eight IPC channels (spec listed six; added `db:get-tasks-by-date`, `db:create-event`, `db:get-capture-entries` for complete repository surface).
- No WAL mode (per spec); synchronous `better-sqlite3` in main only.
- Seed uses stable mock IDs so demo data matches renderer expectations when wired.

## What's left / known gaps

- Renderer / Zustand still reads memory mocks — **Agent A** should load via `window.api.db` on startup and persist mutations.
- No migration from existing in-memory state (first launch only seeds empty DB).
- `capture_entries` table is populated via IPC but not yet shown in UI lists.
- Full-project `typecheck`/`lint` will pass once parallel agent branches land or WIP is stashed.

## Blockers

None for this agent’s scope.

## Merge risks with other agents

| Agent | Risk | Mitigation |
|-------|------|------------|
| **A (v2 store adapter)** | Touches `ipc-contracts`, preload, renderer store; may add `db` hydration | Merge A after B or combine `db` + hydration in one PR; IPC names are namespaced `db:*` |
| **C (capture refactor)** | Unrelated UI files; branch was briefly shared during commit | Commits are on `agent/sqlite-persistence` only |
| **D (anthropic API)** | Adds `ai:*` IPC alongside `db:*` | Orthogonal channels; merge both contract blocks in `ipc-contracts.ts` |

## Commits (agent/sqlite-persistence)

1. `42419be` — install better-sqlite3, add db module + migrations  
2. `ab441ca` — add repository API  
3. `2a7b5af` — wire IPC handlers + preload bindings  
4. `946f9c6` — seed on first launch  
5. `ef0aafc` — add repository smoke tests  
