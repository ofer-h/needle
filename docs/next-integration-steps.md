# Next integration steps (post-orchestration merge)

Ordered phases after `needle-ai-orchestration`. Each phase lists files, acceptance criteria, and verification.

---

## Phase 1 — Local dev ergonomics

**Goal:** Classify works locally without pasting a key into the UI every session.

| Area | Files |
|------|--------|
| Env loading | `src/main/load-env.ts`, `src/main/index.ts`, `.env.example` |
| Key resolution | `src/main/ai/config.ts` |
| Smoke | `src/renderer/components/Capture/CaptureScreen.tsx`, `src/main/ai/classify.ts` |

**Acceptance**

- `.env` at repo root with `ANTHROPIC_API_KEY` is loaded on `npm start` (dev only; packaged app skips dotenv).
- Capture classify returns a real result for a short brain-dump string.
- `hasApiKey` is true when env is set (even if UI field is empty).

**Verify**

```bash
cp .env.example .env   # edit ANTHROPIC_API_KEY
npm start              # Capture → type text → classify
npm run typecheck
npm run lint
```

---

## Phase 2 — Renderer hydrates from SQLite

**Goal:** Today/Capture read durable data; Zustand is a cache, not the source of truth.

| Area | Files |
|------|--------|
| IPC (existing) | `src/shared/ipc-contracts.ts`, `src/main/ipc/db-handlers.ts`, `src/preload/index.ts` |
| Hydrate | `src/renderer/App.tsx` or `src/renderer/state/store.ts` — `useEffect` on mount |
| Types | `src/shared/types.ts` |

**Acceptance**

- On app load, `window.api.db.getTasks()` and `getEvents()` populate the store (or a dedicated hydrate action).
- Creating/updating/deleting a task in the UI calls `db:create-task` / `db:update-task` / `db:delete-task` and updates local state from the response.
- Restart app → tasks/events match what was saved (seed only runs when DB empty).

**Verify**

```bash
npm start
# Create/edit task in UI, quit, restart — data persists
npm run test
npm run typecheck
```

---

## Phase 3 — Classify persists

**Goal:** Capture flow writes to SQLite, not only in-memory.

| Area | Files |
|------|--------|
| Classify handler | `src/main/ipc/ai-handlers.ts` or `src/main/ai/classify.ts` |
| DB | `src/main/db/repository.ts`, `db:add-capture` handler |
| Renderer | `CaptureScreen.tsx` — optional task create from classification payload |

**Acceptance**

- After successful `ai:classify`, main calls `db:add-capture` with raw text + classification metadata.
- Optional: create/update task when classification implies an actionable item.
- `db:get-capture-entries` returns the capture after classify.

**Verify**

```bash
npm start
# Classify in Capture → inspect DB or get-capture-entries via devtools/preload
npm run test
```

---

## Phase 4 — Today on v2 adapter (optional dogfood)

**Goal:** Exercise v2 domain + adapter on the real Today screen without blocking v1.

| Area | Files |
|------|--------|
| Adapter | `src/renderer/state/store-v2-today-adapter.ts`, `src/renderer/state/fixture-v2.ts` |
| Store swap | `TodayScreen.tsx`, `App.tsx` — feature flag or `import { useAppStore } from './store-v2-today-adapter'` |
| Tests | `src/renderer/state/store-v2-today-adapter.test.ts` |

**Acceptance**

- Flag on: Today timeline built from v2 fixture/adapter selectors; DnD and expand still work.
- Flag off: current v1 mock store unchanged.
- No regression in typecheck/lint/tests.

**Verify**

```bash
npm run test -- store-v2
npm run typecheck
npm start   # dogfood with flag enabled
```

---

## Suggested order

1. Phase 1 (done on this branch)
2. Phase 2 — unblocks real persistence for everything else
3. Phase 3 — completes Capture vertical slice
4. Phase 4 — when Ofer wants v2 validation on Today
