# Decision record: Async UX + observability baseline

**Date:** 2026-05-27  
**Drivers:** User reports (classify stuck on dots, API key “Saving…” forever); goal of best-in-class failure visibility for a local-first macOS app.  
**Status:** Implemented in tree (dev); not all flows migrated yet.

---

## Problem

1. **Trust-breaking pending UI** — Capture showed four “thinking” dots with no elapsed time, cancel, or guaranteed exit. Users could not tell if work was progressing or the app was broken.
2. **Silent failures** — IPC/network errors could leave UI in `classifying` or `saving` without a message; optimistic Today edits could diverge from SQLite with no feedback.
3. **Hard to debug** — No correlated logs, no dev summary of last classify, no written playbook for “user said stuck.”

---

## Decisions (what we chose and why)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Finite-state pending in renderer** via `usePendingOperation` (`idle` \| `pending` \| `success` \| `error`) with explicit `cancelled` outcome | Avoids impossible combos (`loading && error`). Matches FSM guidance (see `docs/async-ux.md` research). |
| D2 | **Hard timeouts** — 30s classify (main + renderer), 10s API key save, 3s “slow” hint | Suspense/async boundaries alone can wait forever; product must bound wait time. |
| D3 | **`AsyncStatusPanel`** — dots + label + elapsed + slow copy + Cancel | Dots alone are insufficient; users need progress signal and escape hatch. |
| D4 | **Dual logging** — `[needle]` main (dev only), `[needle-ui]` renderer (DevTools) | Electron: two processes; both must be observable during manual QA. |
| D5 | **No secrets in logs** — `textLen`, `keySource`, `bucket`, safe `error` only | Local-first + API keys in env/userData. |
| D6 | **In-memory flow health** (last 50 events + `lastClassify`) via `app:getFlowHealth` | Dev-only insight without new npm deps; aligns with future `docs/v2/sync-access-observability.md` but not shipping analytics yet. |
| D7 | **`flowId` on main classify path** (`mintFlowId` + `recordFlowEvent`) | Correlate terminal `[needle] [flow]` lines; renderer can log same id when we pass it over IPC (not yet in classify response). |
| D8 | **Governance in repo** — rules + skills + integration phases | Prevent regression: agents must use `needle-async-ux`, `needle-observability`, `needle-debug-app-state`. |
| D9 | **Defer Sentry / product analytics** | Document optional phases in `docs/observability.md`; no SDK until explicit product decision. |
| D10 | **`.env` + dual path load** (`__dirname/../../.env` and `cwd/.env`) | Forge dev bundle path was fragile; user expects repo-root key. |

---

## What we did *not* do (yet)

Documented in codebase audit (2026-05-27); treat as backlog, not forgotten:

| Priority | Gap |
|----------|-----|
| **P0** | Today `hydrateFromDb()` — no pending/error UI, no timeout |
| **P0** | Packaged builds: `needleLog` silent — no file/crash pipeline |
| **P1** | Task mutations — optimistic UI + silent `persistTaskPatch` failures |
| **P1** | `db:addCapture` after classify — fire-and-forget; user may see success without DB row |
| **P1** | Intervention layer — `console.*` instead of `uiLog`; capture persist not awaited |
| **P2** | Pass `flowId` to renderer in classify IPC response for log correlation |
| **P2** | Flow health for `setApiKey`, `hydrateDb` |
| **P2** | Optional Sentry, local analytics counters on disk |

---

## Implementation map (revisit checklist)

### Async UX (renderer)

| File | Role |
|------|------|
| `src/renderer/hooks/usePendingOperation.ts` | FSM + timeout + cancel generation guard |
| `src/renderer/components/primitives/AsyncStatusPanel.tsx` | Pending UI primitive |
| `src/renderer/components/primitives/AsyncStatusPanel.css` | Styles |
| `src/renderer/components/Capture/CaptureScreen.tsx` | Classify: hook + panel + error screen |
| `src/renderer/components/Capture/ApiKeySettings.tsx` | Save: hook (10s); partial vs full panel |
| `src/renderer/utils/ui-log.ts` | `[needle-ui]` logging |

### Main / IPC

| File | Role |
|------|------|
| `src/main/log.ts` | `needleLog` (dev only) |
| `src/main/load-env.ts` | `.env` load + log |
| `src/main/diagnostics.ts` | `getAppDiagnostics()` |
| `src/main/ai/classify.ts` | 30s timeout, `needleLog`, `recordFlowEvent` |
| `src/main/ai/config.ts` | Key resolution + `getApiKeySource()` |
| `src/main/services/flow-health.ts` | Ring buffer + `mintFlowId` |
| `src/shared/flow-health.ts` | Shared types |
| `src/main/ipc/index.ts` | `app:getDiagnostics`, `app:getFlowHealth` |
| `src/main/ipc/ai-handlers.ts` | AI IPC + logs |
| `src/main/index.ts` | Boot log after handlers |
| `src/preload/index.ts` | Bridge |
| `src/shared/ipc-contracts.ts` | `AppDiagnostics`, `FlowHealthSnapshot` |

### Dev UI

| File | Role |
|------|------|
| `src/renderer/components/DevTools/BuildDiagnostics.tsx` | v, SHA, key source, last classify ms/outcome |
| `src/renderer/App.tsx` | Mounts strip |

### Docs, rules, skills

| Path | Role |
|------|------|
| `docs/async-ux.md` | Async UX reference + QA |
| `docs/observability.md` | Logging, flow health, stuck playbook |
| `docs/next-integration-steps.md` | Phase 0 + 0b |
| `docs/decisions/2026-05-27-async-ux-and-observability.md` | This file |
| `.cursor/rules/async-ux.mdc` | Renderer async checklist |
| `.cursor/rules/observability.mdc` | Logging / flowId checklist |
| `.cursor/skills/needle-async-ux/SKILL.md` | Implement/review pending UI |
| `.cursor/skills/needle-observability/SKILL.md` | Instrument + verify logs |
| `.cursor/skills/needle-debug-app-state/SKILL.md` | Triage stuck/broken UI |
| `memory/decisions.md` | Chronological log (points here) |
| `memory/context.md` | Current state summary |

---

## How to verify (smoke)

```bash
npm start
```

1. Bottom-left: `v0.1.0`, git SHA, `key: .env` (if `.env` loaded), after classify `classify ok Nms` or `classify error Nms`.
2. Capture → type → Enter: elapsed seconds, slow hint ~3s, Cancel returns to typing; failure within 30s shows error screen.
3. Terminal: `[needle] [boot] ready`, `[needle] [flow] classify start`, `[needle] [flow] classify end`.
4. DevTools: `[needle-ui] [capture] classify start` → ok/error.
5. DevTools: `await window.api.app.getFlowHealth()` → `lastClassify`, `events[]`.

```bash
npm run typecheck && npm run lint && npm test -- --run
```

---

## How to debug later (“user said stuck”)

1. Skill: **`.cursor/skills/needle-debug-app-state/SKILL.md`**
2. Doc: **`docs/observability.md`** § Manual playbook
3. Order: BuildDiagnostics → terminal `[needle]` → DevTools `[needle-ui]` → `getFlowHealth()` → userData paths

---

## Research references (external)

Captured in `docs/async-ux.md` and observability planning:

- [React Suspense](https://react.dev/reference/react/Suspense) — declarative fallbacks; pair with error boundaries; optional delayed fallback (~200ms).
- [Async boundaries](https://frontendpatterns.dev/async-boundary) — explicit timeout required.
- TanStack Query error-state discussions — distinguish hard vs background error; granular retry surfaces.
- [use-query-state-layout](https://github.com/LivioGama/use-query-state-layout) — Loading / Error / Empty / Hydrated pattern.

Future product analytics direction (not implemented): `docs/v2/sync-access-observability.md`.

---

## Revisit triggers

Re-open this record when:

- Adding a new user-visible `await window.api.*` in renderer
- Shipping packaged builds with support expectations
- Adding Sentry, PostHog, or local telemetry
- Migrating Today hydrate or task persistence to full async UX
- Changing classify timeout or model

Update **Status**, **What we did not do**, and `memory/decisions.md` when scope changes.
