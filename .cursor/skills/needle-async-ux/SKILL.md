---
name: needle-async-ux
description: >-
  Implement or review async UI flows in Needle (IPC, classify, save, load) so
  pending states always resolve with timeout, cancel, slow hints, and actionable
  errors. Use when adding loading spinners, fixing stuck classifying/saving,
  infinite dots, silent failures, or any user-triggered await in the renderer.
---

# Needle async UX

Prevent “nothing happened” UI. Every flow must end in **success**, **actionable error**, or **cancel** — never infinite pending.

## When to use

- User reports stuck loading, endless dots, “Saving…” forever
- Adding a new `await window.api.*` in renderer
- Reviewing Capture, API key modal, brain-dump, or any IPC-backed action
- Planning integration phases that touch network or main process

## Read first

1. `docs/decisions/2026-05-27-async-ux-and-observability.md` — what shipped, file map, open gaps
2. `docs/async-ux.md` — rules, research links, QA script
3. `.cursor/rules/async-ux.mdc` — checklist
4. `docs/observability.md` + **`needle-observability`** — logging and `flowId` when instrumenting
5. Existing primitives:
   - `src/renderer/hooks/usePendingOperation.ts`
   - `src/renderer/components/primitives/AsyncStatusPanel.tsx`
   - `src/renderer/utils/ui-log.ts`
   - `src/main/log.ts`

## Implementation steps

1. **Main process** — Ensure handler returns `{ error: string }` on failure; add `needleLog` at start/end; add `Promise.race` timeout for network calls (see `classify.ts`).
2. **Renderer** — Wrap in `usePendingOperation`; map outcomes:
   - `success` → next screen
   - `error` → error UI + retry
   - `cancelled` → return to previous screen (do not show generic error)
3. **Pending UI** — Use `AsyncStatusPanel` with `onCancel` for ops expected >3s.
4. **Log** — `uiLog('scope', 'event', { ms, … })` (no secrets).
5. **Verify** — Run manual QA from `docs/async-ux.md`; confirm terminal + DevTools logs match UI.

## Review rubric (PR / self-check)

| Check | Pass? |
|-------|-------|
| Pending cannot last forever (timeout) | |
| User can cancel long operations | |
| Slow hint after 3s | |
| Elapsed time visible | |
| Error has Try again + context action | |
| Cancel does not show error screen | |
| Logs in main + renderer | |

## Do not

- Add TanStack Query or XState unless the task explicitly requires it
- Use global full-window blocking loaders for local IPC
- Log API keys or payloads with secrets

## Hand off

Visual polish only → `needle-design-review`. Token/styling → `needle-design-system`.  
User reports stuck with unclear cause → **`needle-debug-app-state`**.
