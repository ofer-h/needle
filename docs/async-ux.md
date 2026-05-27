# Async UX — loading, failure, and “nothing happened”

Needle must never leave users staring at an infinite spinner. Every user-triggered async flow (IPC, network, file I/O surfaced in UI) must **terminate** in success, actionable error, or explicit cancel — with a **hard timeout**.

**Decision record (full implementation map + open gaps):** [docs/decisions/2026-05-27-async-ux-and-observability.md](./decisions/2026-05-27-async-ux-and-observability.md)

This doc is the product/engineering source of truth. Agents should also read:

- `.cursor/rules/async-ux.mdc` — enforceable checklist
- `.cursor/skills/needle-async-ux/SKILL.md` — implementation workflow

---

## Why this matters

The Capture “classifying” dots with no feedback is a **trust-breaking** failure mode: the app looks alive but is stuck. That pattern is worse than a clear error because users assume the product is broken without a recovery path.

---

## Research (concise)

| Source | Takeaway for Needle |
|--------|---------------------|
| [React Suspense](https://react.dev/reference/react/Suspense) | Declarative fallbacks; pair with error boundaries; avoid spinner flash (delay ~200ms optional). |
| [Frontend Patterns — Async Boundary](https://frontendpatterns.dev/async-boundary) | Boundaries need **explicit timeout** — Suspense alone can wait forever. |
| [TanStack Query discussions](https://github.com/TanStack/query/discussions/4956) | Distinguish **hard error** (no data yet) vs background error; always expose **retry** at the right granularity. |
| [use-query-state-layout](https://github.com/LivioGama/use-query-state-layout) | Four UI states: Loading, Error, Empty, Hydrated — no boolean soup. |
| XState / FSM articles | One visible state at a time: `idle` → `pending` → `success` \| `error`; invalid combos forbidden. |

**Needle stack note:** We use IPC + Zustand, not React Query. The same rules apply: model **pending** explicitly in the renderer, timeout in **both** main and renderer, log with `[needle]` / `[needle-ui]`.

---

## Non-negotiable rules

1. **No infinite pending** — Default max wait **30s** (10s for trivial local IPC like saving a key). After that → error UI with retry/cancel.
2. **Always exit pending** — `try/finally` or `usePendingOperation`; never set `loading=true` without a path to `false`.
3. **Cancel** — Long operations (>3s expected) offer **Cancel** that returns to the previous screen.
4. **Slow hint** — After **3s** pending, show copy: “Taking longer than usual” (not just dots).
5. **Elapsed time** — Show seconds on pending UI so testers know time is passing.
6. **Actionable errors** — Message + **Try again** + context action (e.g. API key). Never silent failure.
7. **Logging** — `uiLog` in renderer, `needleLog` in main; include scope, duration, outcome (never secrets).
8. **Stale IPC** — Ignore results after cancel/new run (generation id in `usePendingOperation`).

---

## Implementation primitives (repo)

| Piece | Path |
|-------|------|
| Hook | `src/renderer/hooks/usePendingOperation.ts` |
| Pending UI | `src/renderer/components/primitives/AsyncStatusPanel.tsx` |
| Example | `src/renderer/components/Capture/CaptureScreen.tsx` |
| Main timeout | `src/main/ai/classify.ts` |
| Dev diagnostics | `BuildDiagnostics` + `app:getDiagnostics` |

---

## Checklist for new async flows

Before merging any feature that awaits IPC or network in the renderer:

- [ ] Uses `usePendingOperation` or equivalent FSM (not raw `useState(loading)` alone)
- [ ] Timeout configured and tested
- [ ] Error UI with retry (and secondary action if relevant)
- [ ] Cancel returns to prior screen when operation can exceed 3s
- [ ] `AsyncStatusPanel` or matching pattern (elapsed + slow message)
- [ ] `uiLog` at start, success, error, cancel
- [ ] Main handler logs + returns `{ error: string }` instead of hanging
- [ ] Manual test: airplane mode / invalid key / kill network → user sees error within 30s

---

## Manual QA script (Capture)

1. `npm start` — bottom-left shows version, git SHA, `key: .env` if configured.
2. Capture → type task → Enter — dots show **elapsed seconds**; after 3s, slow message; **Cancel** returns to typing.
3. Break network or remove key — within 30s, **Something went wrong** with Try again / API key.
4. Terminal: `[needle] [ai] classify start` → `ok` or `failed` with ms.
5. DevTools: `[needle-ui] [capture] classify …` matches UI outcome.

---

## Future (not required for every PR)

- Product analytics / local “flow health” counters (classify success rate, p95 latency)
- Opt-in Sentry for main+renderer on IPC errors
- TanStack Query if we move to HTTP-heavy data layer
