# Decision record: UI redesign as `@needle/ui-web` + `apps/studio`

**Date:** 2026-05-31
**Drivers:** The desktop UI feels complex; the owner wants a simpler, beautiful,
browser-viewable redesign with reusable typed interfaces and an open/closed template
system, without destabilizing the shipping Electron app.
**Status:** In progress — Phase 0 (scaffold + full model layer) implemented and
typechecking on `v2-monorepo`; Phases 1–4 (UI build) pending.

---

## Problem

1. The task model is split between a rich canonical model (`packages/domain/src/domain-v2.ts`)
   and a flatter renderer model (`packages/domain/src/types.ts`) — the owner's mental
   picture lives across both, and "all the moving parts" are hard to find.
2. The current UI surfaces confusing affordances: raw **Task/Original/Reason/Notes**
   labels, a cryptic **"30 min lead"** button, a **"Choose parent…"** subtask dropdown,
   and a heavy **separate full-screen, AI-only** add flow with no manual create and no
   end-time/duration.
3. There is no transport-agnostic UI layer to reuse for the planned `apps/web`
   (the F3 seam of the monorepo plan is unbuilt).

---

## Decisions (what we chose and why)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **New package `packages/ui-web` + thin demo `apps/studio`** | Owner wants reuse + a web-viewable artifact, not a throwaway. This is the F3 "extract shared web UI" seam. |
| D2 | **One canonical item model; templates are pure presentation config** | Open/closed principle: switching or building a template never touches data — it registers a config object. |
| D3 | **Reuse `@needle/domain` entities; new types live in `ui-web/src/model`, marked "promote into domain once validated"** | Don't fork the model; keep the shipping domain package stable while iterating on UI-driven types. |
| D4 | **Default template = Editorial** (calm, centered, single column) | Best matches "simple as can be" + the brand. Compact/Timeline/Kanban available in the gallery. |
| D5 | **Gallery + basic template builder** | "Make your own" works end-to-end now; user templates are the same shape, persisted locally. |
| D6 | **Mock/local seed data; AI + coach + chat scripted/deterministic** | De-risk the UX before wiring real services; no backend/LLM this round. |
| D7 | **All AI actions visible, attributed, revertible** (`RevisionLog`) | Per `product-direction.md` — trust through reversibility; mirrors canonical `ActivityLog.before/after`. |
| D8 | **`apps/desktop` left untouched this round** | Prove the patterns in isolation; migrate the renderer later. |
| D9 | **`model/index.ts` barrel is allowed here** (one curated public surface) | Deliberate, documented divergence from `typescript.mdc`'s "no barrels" — that rule targets the Electron renderer, not a publishable package. |

---

## What we did *not* do (yet)

| Priority | Gap |
|----------|-----|
| **P0** | The UI itself — `TodayBoard`, `ItemLine`, `InlineAdd`, layouts (Phase 1). Phase 0 shipped the model + scaffold only. |
| **P1** | Countdown widget + alert rotation, `EventEditor`, `NotificationSettings` (Phase 2). |
| **P1** | `BrainDump`, `CoachPanel`, `ChatDock`, `RevisionTimeline` UI (Phase 3) — the pure logic exists; the surfaces do not. |
| **P2** | `TemplateBuilder` + `KanbanLayout` + component gallery (Phase 4). |
| **P2** | Real persistence/AI/backend — intentionally mocked; integration is a later track. |
| **P3** | Migrating `apps/desktop` onto `ui-web`, and consuming `ui-web` from the future `apps/web`. |

---

## Implementation map (revisit checklist)

### `packages/ui-web`

| File | Role |
|------|------|
| `src/styles/{primitives,tokens,base}.css` | Ported design tokens + resets; `styles/index.ts` also loads fonts via `@fontsource`. |
| `src/primitives/*` | Self-contained `Icon` (inline SVG), `Button`, `Checkbox`, `Pill`, `ProgressBar`, `Divider`. |
| `src/model/domain.ts` | Canonical re-export of `@needle/domain/domain-v2`. |
| `src/model/template.ts` | `Template`, `TemplateRegistry`, `BUILTIN_TEMPLATES` — the open/closed core. |
| `src/model/today.ts` | `buildTodayView()` assembles canonical `TodayItemView[]`. |
| `src/model/countdown.ts` | Hard stops, `deriveCountdown()`, `alertStylePool` + `rotateAlertStyle()`. |
| `src/model/{ritual,coach,chat,revision}.ts` | Pure logic for ritual, coach engine, scripted chat, revertible revisions. |
| `src/model/index.ts` | The one barrel — every moving part. |

### `apps/studio`

| File | Role |
|------|------|
| `src/main.tsx` | Loads `@needle/ui-web/styles`, mounts `App`. |
| `src/App.tsx` | Shell: left-rail scenario nav + theme toggle; per-screen render (filled per phase). |
| `src/theme.ts` | Light/dark synced to `<html data-theme>`, persisted. |
| `src/studio.css` | Demo-harness chrome only (feature styling lives in `ui-web`). |

---

## How to verify (smoke)

```bash
pnpm install
pnpm --filter @needle/ui-web typecheck
pnpm --filter @needle/studio typecheck
pnpm --filter @needle/ui-web test
pnpm --filter @needle/studio dev
```

1. `dev` opens the studio shell in the browser; the left rail lists every scenario.
2. Toggle light/dark in the top-right — tokens/fonts swap correctly.
3. (Phase 1+) Each scenario screen renders real `ui-web` components.

---

## How to debug later ("a template changed my data")

If switching templates ever mutates items, the open/closed invariant (D2) is broken —
templates must be **read-only config**. Check that layout renderers receive
`TodayItemView[]` + a `Template` and never call mutators; all mutations flow through
`applyChat` / explicit handlers that log a `Revision`.

---

## Research references (external)

- Open/closed principle applied to UI: presentation config registries vs. branching
  components.
- ADHD anti-habituation: novelty/variable-reward rotation for recurring alerts
  (informs `alertStylePool` + `rotateAlertStyle`). See `accountability-and-scoring.md`.

---

## Revisit triggers

- A second consumer (`apps/web`) starts importing `ui-web` → revisit the public
  surface and consider promoting `model/*` types into `@needle/domain`.
- Real AI/backend wiring begins → replace scripted `applyChat`/`coachEngine` with
  service calls behind the same signatures.
- `apps/desktop` migrates onto `ui-web` → reconcile the two primitive sets.

Update **Status**, **What we did not do**, and `memory/decisions.md` when scope
changes. Living detail: [`../v2/studio-redesign.md`](../v2/studio-redesign.md).
