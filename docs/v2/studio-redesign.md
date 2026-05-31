# Studio: UI Redesign + Reusable Design System (`@needle/ui-web`)

**Status:** in progress (started 2026-05-31, branch `v2-monorepo`).
**Owner:** Ofer. **North star:** [`product-direction.md`](./product-direction.md),
[`../positioning.md`](../positioning.md), [`accountability-and-scoring.md`](./accountability-and-scoring.md).

This is the **living record** of the Studio redesign — what we are building, why,
the decisions locked, and how the pieces fit. Read this before touching
`packages/ui-web` or `apps/studio`. The point-in-time decision is captured as an
ADR: [`../decisions/2026-05-31-ui-web-studio-redesign.md`](../decisions/2026-05-31-ui-web-studio-redesign.md).

> **Continuing this work / picking it up fresh?** Start at
> [`studio-handoff.md`](./studio-handoff.md) — it has the current exact state (Phase 4
> is mid-flight and the repo does not yet compile; one trivial wiring fix), the precise
> remaining steps, how to run it, the full file map, and the gotchas.

---

## Why

The Electron app (`apps/desktop`) works but feels **complex and hard to reason
about**. Concretely:

- The task model is **split in two**: a rich canonical model
  ([`packages/domain/src/domain-v2.ts`](../../packages/domain/src/domain-v2.ts)) and
  a flatter renderer model ([`packages/domain/src/types.ts`](../../packages/domain/src/types.ts)).
  The owner's mental picture lives across both.
- The UI surfaces **confusing affordances**: `ItemDetail.tsx` shows raw
  **Task / Original / Reason / Notes** labels, a cryptic **"30 min lead"** button, and
  a **"Choose parent…"** dropdown for nesting subtasks. Adding a task happens on a
  **separate full-screen Capture flow** (`CaptureScreen.tsx`) — heavy, AI-only, no
  manual create, no end-time/duration.

The owner wants a **much simpler, beautiful, fully-working** redesign that opens **in
a browser** (not locked inside Electron), with **reusable typed interfaces** and an
**open/closed template system**. It establishes the patterns the planned `apps/web`
will reuse, and it does **not** touch `apps/desktop` this round.

This is also the **F3 seam** from the monorepo plan — "extract shared web UI +
tokens" ([`monorepo-migration-plan.md`](./monorepo-migration-plan.md),
[`multi-app-roadmap.md`](./multi-app-roadmap.md)). `packages/ui-web` is the
transport-agnostic UI layer: components take data via props, no Electron, no backend.

---

## What we're building

- **`packages/ui-web`** — the reusable design system: tokens + fonts, slim
  primitives, the canonical model + new presentation/logic types, the template
  registry, and the feature components. Publishable-shaped; consumed by source.
- **`apps/studio`** — a thin Vite + React demo you open in the browser
  (`pnpm --filter @needle/studio dev`). Left rail navigates every scenario; a
  scenario clock fast-forwards time so countdowns/alerts are demoable; light/dark
  toggle.

`apps/desktop` is untouched. Once the patterns prove out, `ui-web` is what `apps/web`
imports, and the desktop renderer can migrate onto it later.

---

## Decisions (locked with owner)

| # | Decision | Why |
|---|----------|-----|
| D1 | Form = `packages/ui-web` (reusable) + thin `apps/studio` demo | Owner wants reuse + a web-viewable artifact, not a throwaway prototype. |
| D2 | **One canonical item model; templates are pure presentation config** | Open/closed: switching or building a template never touches data — it registers a config object. |
| D3 | Reuse `@needle/domain` (`domain-v2.ts`) entities; new types live in `ui-web/src/model` marked "promote into domain once validated" | Don't fork the model; keep the shipping domain package stable while iterating. |
| D4 | Default template = **Editorial** (calm, centered, single column) | Best matches "simple as can be" and the brand. Compact/Timeline/Kanban live in the gallery. |
| D5 | Ship the template **gallery + a basic builder** | "Make your own" works end-to-end now; user templates are the same shape, persisted locally. |
| D6 | Front-end prototype: **mock/local seed data**; AI + coach + chat are **scripted/mocked** (deterministic), no backend/LLM this round | De-risk the UX before wiring real services. |
| D7 | All AI actions are **visible, attributed, and revertible** | Per `product-direction.md` — trust through reversibility (canonical `ActivityLog.before/after`). |

---

## Architecture: one model, templates are pure config

Single canonical item model; **templates never change data, only presentation**.
Adding a template = registering one config object; user-authored templates are the
same shape persisted to local storage.

**Canonical entities reused** (from `@needle/domain`): `Item`
(`kind: task|event|note|memory|habit`, `bucket: act|remember`,
`commitmentLevel: soft|firm|unmissable`), `ItemPlan` (`mode: anchor|float|stash`),
`ItemOccurrence`, `ItemRelation` (`contains` = subtasks, `prep_for` = travel prep),
`Suggestion`, `Intervention`, `Ritual`, `CaptureEntry`, `NotificationPreference`,
`ActivityLog`, `TodayItemView` / `DailyFlowView`.

**New presentation/logic types** (`packages/ui-web/src/model/`, promote later):

| Module | Contents |
|--------|----------|
| `template.ts` | `Template`, `TemplateRegistry` (the open/closed core), `effectiveLayout()` |
| `today.ts` | `TodayData`, `buildTodayView()` → canonical `TodayItemView[]`, `childrenOf()` |
| `countdown.ts` | `HardStop`, `CountdownState`, `AlertStyle` + `alertStylePool`, `deriveCountdown()`, `rotateAlertStyle()` (anti-habituation), `nextHardStop()` |
| `ritual.ts` | `RitualInstance` (5/5/5 dump/plan/break), `advanceRitual()`, `costOf()` |
| `coach.ts` | `CoachNudge`, `AccountabilityMode = gamified\|coached\|self`, `coachEngine()` |
| `chat.ts` | `ChatMessage`, `applyChat()` (scripted, returns revertible revision) |
| `revision.ts` | `Revision`, `RevisionLog` (append-only, `undo()` restores before-snapshot) |
| `factory.ts` | `mkItem/mkPlan/mkOccurrence/mkRelation` — mint canonical entities with defaults |

**The `model/index.ts` barrel is intentional** — it's the "one place to see every
moving part" the owner asked for. This is a deliberate divergence from
`.cursor/rules/typescript.mdc` ("no barrel re-exports"), which targets the Electron
renderer; a publishable package's curated public surface is the opposite need.

All `model/*` logic is **pure** (no React, no I/O) → unit-testable with Vitest.

---

## Signature features (rooted in the transition-coach thesis)

1. **Countdown to next hard-stop** — clock-adjacent, floating, and a simulated
   app-icon badge. The alert **style rotates** (color/motion/scale/sound/surface) as
   the deadline nears so the ADHD brain never habituates (`alertStylePool`).
2. **Progress kudos** — "3 of 5 done", supportive, no streak shame.
3. **Alarm-style events** — e.g. kids pickup (`commitmentLevel: unmissable`); coach
   asks travel time + buffer and auto-creates a `prep_for` "leave by 13:25" hard-stop.
4. **AI chat** — add/edit/remember; every change is a revertible `Revision`.
5. **Notification settings** — lead times before a hard stop, quiet hours, which
   alert styles rotate, sound, brain-dump help.
6. **Brain-dump ritual** — timed 5/5/5 sub-blocks with per-block countdown +
   "where to pick up from".
7. **Versioning / revert** — `RevisionTimeline`, AI changes flagged, one-click undo.
8. **AI coach/manager** — `coachEngine()` decides what to push next; 3 accountability
   modes (gamified / coached / private-self).

## Pain points explicitly fixed

- No **Task/Original/Reason/Notes** labels — just the text.
- **"30 min lead"** → a clear "remind / leave N before" tied to events.
- **"Choose parent…"** dropdown removed — subtasks via indentation/markdown.
- Adding a task is **inline**, **manual or AI**, with **time + duration/end-time**.
- **Subtasks** are simple indented text with always-visible inline add.
- **"Select yesterday's unfinished"** single button.

---

## Build phases (each ends runnable in the browser)

- **Phase 0 — Scaffold** ✅ `ui-web` + `studio`, ported tokens/primitives, the full
  `model/` layer (types + pure logic), studio shell with theme + nav. Both typecheck.
- **Phase 1 — Core redesign** ✅ `TodayBoard` + `ItemLine` (simple text, inline edit,
  subtasks, `task-123` auto-link) + `InlineAdd` (manual + ✨ AI, time chip, pull
  yesterday) + `ProgressKudos` + Editorial/Compact/Timeline layouts + template registry
  wired + studio Today/Add screens + seed data. 17 model unit tests pass; typecheck,
  lint, build all green; verified in-browser (Editorial light + Timeline dark, template
  switch leaves data untouched). *(the core redesign)*
- **Phase 2 — Countdown + events** ✅ `Countdown` (inline + floating + app-icon badge,
  alert style rotates by time band) + `NotificationSettings` (lead times, quiet hours,
  rotation pool, sound) + `EventEditor` + kids-pickup travel-prep (`addTravelPrep` →
  "leave by HH:MM" hard stop via `prep_for`) + a scenario clock in studio to
  fast-forward time. Typecheck/lint/build/tests green; verified in-browser (countdown
  escalates to urgent at 15m; creating a travel event auto-added "Leave by 14:35").
- **Phase 3 — Coach + chat + ritual** ✅ `BrainDump` (timed 5/5/5 with per-block
  countdown + drift costs) + `CoachPanel` (3 modes, tone-matched nudges from
  `coachEngine`) + `ChatDock` (scripted, each turn a revertible revision) +
  `RevisionTimeline` (AI-flagged, one-click undo). Studio owns a shared `RevisionLog`.
  Verified in-browser: chat "add …" → revision logged → undo restored the snapshot and
  removed the task; Coached vs Gamified produced different voices for the same signal.
- **Phase 4 — Builder + polish** `TemplateBuilder` (custom templates) + `KanbanLayout`
  + component gallery + final verification.

---

## How to run / verify

```bash
pnpm install
pnpm --filter @needle/studio dev          # open the demo in a browser
pnpm --filter @needle/ui-web typecheck
pnpm --filter @needle/ui-web test          # Vitest — pure model logic
pnpm --filter @needle/ui-web build         # publishable lib build
```

Click through: Today + each template; inline add (manual & AI); countdown
fast-forwarded via the scenario clock to watch rotation; kids-pickup prep;
brain-dump ritual; coach nudges in each mode; chat mutate→revert; notification
settings; template builder save→appears in gallery. Toggle light/dark.

---

## Conventions & relevant tooling

This work follows the repo's existing rules in `.cursor/rules/` — especially
`design-tokens.mdc` (semantic tokens only, no raw hex), `design-primitives.mdc`
(per-primitive folder, ≤4 variants, all interactive states), `react.mdc`,
`typescript.mdc` (strict; the model barrel is the one documented exception), and
`testing.mdc`. Package-specific guidance lives in
[`packages/ui-web/CLAUDE.md`](../../packages/ui-web/CLAUDE.md) and
[`.cursor/rules/ui-web.mdc`](../../.cursor/rules/ui-web.mdc).

Relevant **`.cursor/skills/`** workflows when extending this:
`needle-build-component`, `needle-design-system`, `needle-add-token`,
`needle-domain-architecture`, `needle-dark-mode-fix`, `needle-ui-audit`.
