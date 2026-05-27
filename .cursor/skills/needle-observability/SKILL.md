---
name: needle-observability
description: >-
  Add or review logging, flow health, and debug signals in Needle. Use when
  instrumenting async flows, adding monitoring hooks, planning Sentry/analytics,
  or verifying that main and renderer logs correlate via flowId.
---

# Needle observability

Make failures visible and correlatable across main and renderer without leaking secrets.

## When to use

- Adding a new IPC flow or multi-step user action
- Reviewing whether logs are sufficient before merge
- Planning crash reporting or analytics (docs only until approved)
- Checking classify / flow latency in dev

## Read first

1. `docs/decisions/2026-05-27-async-ux-and-observability.md` — implementation map and backlog
2. `docs/observability.md`
3. `.cursor/rules/observability.mdc`
4. Code:
   - `src/main/log.ts`, `src/renderer/utils/ui-log.ts`
   - `src/shared/flow-health.ts`, `src/main/services/flow-health.ts`
   - `src/main/ai/classify.ts` (reference instrumentation)

## Steps

1. **Name the flow** — Stable string (`classify`, `setApiKey`, `hydrateDb`).
2. **Mint `flowId`** — `mintFlowId()` in main at start; pass to renderer in response if needed, or log the same id from renderer when UI-only.
3. **Record events** — `recordFlowEvent({ flowId, flow, kind: 'start' | 'end' | 'error' | 'cancel', ms?, outcome?, meta? })` on main for user-visible work.
4. **Mirror logs** — `needleLog(scope, …)` and `uiLog(scope, …)` at start/end with `flowId` and `ms`; meta must be privacy-safe.
5. **Renderer pending** — Pair with `usePendingOperation` per `needle-async-ux`.
6. **Verify**
   - Terminal: `[needle] [flow]` and scope-specific lines.
   - DevTools: `[needle-ui]` matches UI outcome.
   - Dev strip: `BuildDiagnostics` shows last classify ms/outcome after one run.
   - Optional: `await window.api.app.getFlowHealth()` in DevTools.

## Must not

- Log secrets or full user content.
- Add Sentry/analytics dependencies without explicit ask.
- Replace flow-health ring buffer with heavy persistence in a small PR.

## Hand off

User says **stuck** or **broken** with no clear log gap → use **`needle-debug-app-state`**.
