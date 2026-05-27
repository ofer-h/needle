# Agent B — SQLite Persistence
# Branch: agent/sqlite-persistence
# Model: claude-sonnet-4-5 (implementation work, well-scoped)

## Your mission
Implement Phase F of docs/v2/implementation-roadmap.md: local SQLite persistence so that
data survives app restarts. This is the single biggest gap between the current app and an
everyday-usable tool.

## Read first (in order)
1. scripts/orchestration/KNOWLEDGE_PACK.md
2. docs/v2/implementation-roadmap.md — Phase F spec
3. src/shared/domain-v2.ts — the v2 types your schema must support
4. src/shared/ipc-contracts.ts — IPC contracts you will extend
5. src/main/index.ts — main process entry
6. src/main/ipc/index.ts — existing IPC handlers
7. memory/context.md — full project state

## What to build

### Step 1: Install better-sqlite3
```
npm install better-sqlite3 --legacy-peer-deps
npm install @types/better-sqlite3 --save-dev --legacy-peer-deps
```
better-sqlite3 is synchronous and works well in Electron main process.
Do NOT use sql.js (WASM, wrong for Electron). Do NOT use Sequelize (too heavy).

### Step 2: Database module (src/main/db/index.ts)
Create a database module with:
- open(dbPath: string): Database — opens or creates the SQLite file
  - Store at: app.getPath('userData') + '/needle.db'
- migrate(db): void — runs all pending migrations in order
- close(): void

### Step 3: Migrations (src/main/db/migrations/)
Create migration files: 001_initial_schema.ts
Schema must cover the current v1 data model (matching src/shared/types.ts):
  - tasks table: id, title, notes, date, dateLabel, timeSlot, bucket, kind,
                  startTime, slotIndex, slotOrder, isOverdue, isComplete,
                  subtasks (JSON), source, leadTimeMins, created_at, updated_at
  - calendar_events table: id, title, date, startTime, endTime, link, created_at
  - capture_entries table: id, body, created_at

Also add a migrations table to track what has run.

Migration runner: reads all files in migrations/, runs any not yet in migrations table, in order.

### Step 4: Repository API (src/main/db/repository.ts)
Thin typed wrappers over SQL. No business logic here.

Tasks:
  - getAllTasks(): Task[]
  - getTasksByDate(date: string): Task[]
  - createTask(task: Omit<Task, 'id'>): Task
  - updateTask(id: string, patch: Partial<Task>): Task
  - deleteTask(id: string): void

CalendarEvents:
  - getAllEvents(): CalendarEvent[]
  - getEventsByDate(date: string): CalendarEvent[]
  - createEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent

CaptureEntries:
  - createCaptureEntry(entry: { body: string }): CaptureEntry
  - getRecentCaptureEntries(limit?: number): CaptureEntry[]

### Step 5: IPC handlers (src/main/ipc/db-handlers.ts)
Wire repository calls to IPC channels. Add new channels to ipc-contracts.ts:
  - 'db:get-tasks' → getAllTasks()
  - 'db:create-task' → createTask(payload)
  - 'db:update-task' → updateTask(id, patch)
  - 'db:delete-task' → deleteTask(id)
  - 'db:get-events' → getAllEvents()
  - 'db:add-capture' → createCaptureEntry(payload)

Register handlers in src/main/ipc/index.ts.

### Step 6: Preload bindings (src/preload/index.ts)
Expose the new db channels through contextBridge following the exact same pattern
as existing channels. Add type declarations to src/renderer/window.d.ts.

### Step 7: Seed on first launch
In src/main/index.ts, after db.open():
- Check if tasks table is empty
- If empty, seed with the existing mock data from src/renderer/state/store.ts
  (copy the mock array, insert via repository)
- This means on first launch, user sees the demo data; on subsequent launches, real data

### Step 8: Smoke test
Write src/main/db/__tests__/repository.test.ts:
- Open an in-memory DB (:memory:)
- Run migrations
- CRUD round-trip for tasks and events
- Verify seeded row survives a re-open

## What NOT to do
- Do NOT put SQL in React components or Zustand store
- Do NOT use WAL mode unless you verify it works in the Electron sandbox
- Do NOT break existing IPC channels
- Do NOT add nodeIntegration: true or contextIsolation: false

## Commit cadence
  agent/sqlite-persistence: install better-sqlite3, add db module + migrations
  agent/sqlite-persistence: add repository API
  agent/sqlite-persistence: wire IPC handlers + preload bindings
  agent/sqlite-persistence: seed on first launch
  agent/sqlite-persistence: add repository smoke tests

## Done when
- [ ] better-sqlite3 installed
- [ ] DB opens at userData/needle.db on app start
- [ ] Migrations run automatically
- [ ] All 8 IPC channels wired
- [ ] Preload exposes new channels
- [ ] First-launch seed works
- [ ] npm run typecheck passes
- [ ] npm run lint passes
- [ ] Report written to scripts/orchestration/reports/agent-sqlite-persistence.md
