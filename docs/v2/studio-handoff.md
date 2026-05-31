# Studio redesign — HANDOFF / continuation guide

**Last updated:** 2026-05-31. **Branch:** `v2-monorepo`. **Author of work so far:** AI
(Claude), directed by Ofer.

This file is the single place a fresh agent or session needs to **continue the Studio
redesign without losing context**. Read this top to bottom, then the two reference docs:

- **The plan + decisions (living record):** [`studio-redesign.md`](./studio-redesign.md)
- **The point-in-time ADR:** [`../decisions/2026-05-31-ui-web-studio-redesign.md`](../decisions/2026-05-31-ui-web-studio-redesign.md)
- **Package rules:** [`../../.cursor/rules/ui-web.mdc`](../../.cursor/rules/ui-web.mdc) and [`../../packages/ui-web/CLAUDE.md`](../../packages/ui-web/CLAUDE.md)

---

## TL;DR — what this is

A simpler, beautiful, **browser-viewable** redesign of the Needle UI as a reusable
design-system package (`packages/ui-web`) demoed by a thin Vite app (`apps/studio`).
**The Electron app (`apps/desktop`) is untouched.** Core principle: **one canonical
item model; templates are pure presentation config** (open/closed — switching or
building a template never mutates data).

Built in 5 phases. **Phases 0–3 are DONE and verified in-browser. Phase 4 wiring
is complete and typecheck is GREEN** — run the verify block below and click through
Templates + Components to close the phase.

---

## ⚠️ CURRENT STATE — read first

- `pnpm --filter @needle/ui-web typecheck` → **GREEN**
- `pnpm --filter @needle/studio typecheck` → **GREEN** (`App.tsx` wired:
  `useTemplates`, `TemplatesScreen`, `GalleryScreen`, template gallery CSS)
- **Still to do before calling Phase 4 done:** run the full verify block (lint,
  test, studio build), click through in-browser (custom template persist/delete,
  Kanban switch), then flip Phase 4 to ✅ in `studio-redesign.md` + ADR (Step 5).

**Nothing is committed yet** (`git status` shows the new `packages/ui-web/` and
`apps/studio/` dirs untracked, plus the doc/rule edits). Do NOT commit until the user
asks. There is also an unrelated untracked file `prototype/index copy.html` (pre-existing,
ignore it).

---

## ▶️ Finish Phase 4 — exact remaining steps

Everything below is small and mechanical. Do them in order, then run the verify block.

### Step 1 — Wire `apps/studio/src/App.tsx` (fixes the compile break)

`App.tsx` already imports/uses a lot. You need to:

1. Add import: `import { useTemplates } from './templates';` and the two new screens:
   `import { TemplatesScreen } from './screens/TemplatesScreen';` and (after you create it,
   Step 3) `import { GalleryScreen } from './screens/GalleryScreen';`.
2. In `App()`, call the hook: `const templates = useTemplates();`
3. Pass it down in the `<Screen ... />` call: add `templates={templates}`.
4. In the `Screen` function signature/props type, add `templates: TemplatesApi` (import
   the type: `import type { TemplatesApi } from './templates';`).
5. Route: `if (scenario === 'today') return <TodayScreen ... templates={templates} />;`
   (TodayScreen now needs the `templates` prop). Add
   `if (scenario === 'templates') return <TemplatesScreen templates={templates} />;`
   and `if (scenario === 'gallery') return <GalleryScreen />;`.
6. Remove `templates` and `gallery` from the placeholder fallthrough text.

### Step 2 — Add gallery CSS to `apps/studio/src/screens/screens.css`

`TemplatesScreen.tsx` (already written) references classes that don't exist yet:
`.tpl-gallery`, `.tpl-card`, `.tpl-card--active`, `.tpl-card__bar`, `.tpl-card__head`,
`.tpl-card__name`, `.tpl-card__tag`, `.tpl-card__tag--active`, `.tpl-card__desc`,
`.tpl-card__meta`, `.tpl-card__actions`, `.tpl-card__btn`, `.tpl-card__btn--danger`,
and `.screen__subtitle`. Add a simple responsive card grid (semantic tokens only — see
`.cursor/rules/design-tokens.mdc`). The card uses an inline `--tpl-accent` CSS var
(`var(--<accent>)`) for its top bar/active ring.

### Step 3 — Create `apps/studio/src/screens/GalleryScreen.tsx` (Components showcase)

A simple showcase of the design system: render `Button` (variants primary/subtle/ghost ×
sizes sm/md/lg), `Checkbox` (tones), `Pill` (all `PillTone` values), `ProgressBar`, a grid
of `Icon` names, and maybe one of each feature component in a small frame. Import from
`@needle/ui-web` and `@needle/ui-web` only. Wrap in `<div className="screen">` with an
`<h1 className="screen__title">Components</h1>`. Keep it lightweight.

### Step 4 — Verify (all must pass)

```bash
cd ~/dev/needle
pnpm --filter @needle/ui-web typecheck
pnpm --filter @needle/ui-web lint
pnpm --filter @needle/ui-web test          # 17 tests today; add more if you extend the model
pnpm --filter @needle/studio typecheck
pnpm --filter @needle/studio lint
pnpm --filter @needle/studio build         # should bundle in <1s; then: rm -rf apps/studio/dist
```

Then run it and click through (see "How to run" below): switch templates (incl. Kanban),
open **Templates** → build a custom template → confirm it appears in the Today switcher and
**persists across reload** (localStorage), delete it; open **Components**.

### Step 5 — Update the docs to mark Phase 4 done

- Flip the Phase 4 bullet to ✅ in [`studio-redesign.md`](./studio-redesign.md).
- Flip the ADR **Status** line in [`../decisions/2026-05-31-ui-web-studio-redesign.md`](../decisions/2026-05-31-ui-web-studio-redesign.md).
- Append a closing line to `memory/decisions.md` under the 2026-05-31 entry.

### Then: optional polish pass

`/design-review` (gstack) on the running studio, or a manual pass: empty states, focus
rings, dark-mode contrast on the new Phase 4 cards, reduced-motion. Nothing blocking.

---

## How to run / verify

```bash
cd ~/dev/needle
pnpm install                              # if deps changed
pnpm --filter @needle/studio dev          # → http://localhost:5180/  (vite, port pinned)
```

- The **scenario clock** (top bar) starts at **09:00 today** so the seeded 10:30 standup
  and 14:00 pickup are upcoming hard stops. Use **+5m / +15m / +1h** to fast-forward and
  watch the countdown escalate + its alert style rotate; ▶/⏸ toggles a live tick; ↺ resets.
- Toggle light/dark top-right. All data is mock/local (`apps/studio/src/mock/seed.ts`);
  reload = fresh seed (custom templates persist in localStorage, data does not).

Headless verify with the gstack `/browse` skill (binary at
`~/.claude/skills/gstack/browse/dist/browse`): `goto http://localhost:5180/`, then
`is visible`, `screenshot`, `js "...click()"`. (Per Ofer's global rule, use `/browse`,
never the chrome MCP tools directly.)

---

## What's DONE (Phases 0–3, all verified in-browser)

**Phase 0 — scaffold + full model layer.** `packages/ui-web` + `apps/studio` build/typecheck/
lint/bundle. Tokens + primitives ported (self-contained fonts via `@fontsource`). The
**entire `model/` layer was front-loaded here** (pure, testable logic): see file map below.

**Phase 1 — core redesign.** `TodayBoard` + `ItemLine` (plain text, inline edit,
`task-123` auto-link, subtasks via indentation with always-visible "+ add subtask" — the
Task/Original/Reason labels + "Choose parent…" dropdown + "30 min lead" button are GONE) +
`InlineAdd` (manual or ✨ AI parse, time chip, `*`/`**` subtask shorthand, "pull yesterday's
unfinished") + `ProgressKudos` + Editorial/Compact/Timeline layouts via the open/closed
`LAYOUT_REGISTRY`. Studio Today + Add screens. Verified: Editorial(light) + Timeline(dark),
template switch never mutates data.

**Phase 2 — countdown + events + notifications.** `Countdown` (inline pill + floating card +
app-icon badge; alert STYLE rotates by time band for anti-habituation) + `NotificationSettings`
(lead times, quiet hours, rotation pool, sound) + `EventEditor` + **kids-pickup travel-prep**
(`addTravelPrep` → "Leave by HH:MM" unmissable hard stop via `prep_for`) + the scenario clock.
Verified: countdown hit urgent at 15m; creating a 15:00 travel event auto-added "Leave by 14:35".

**Phase 3 — coach + chat + ritual.** `BrainDump` (timed 5/5/5 with per-block countdown +
skip/postpone drift costs) + `CoachPanel` (3 modes: gamified/coached/self; tone-matched nudges
from `coachEngine`) + `ChatDock` (scripted `applyChat`; each turn a revertible revision) +
`RevisionTimeline` (AI-flagged, one-click undo). Studio owns a shared `RevisionLog`. Verified:
chat "add submit the budget 3pm" → revision logged → **undo restored the snapshot and removed
the task**; Coached vs Gamified gave different voices for the same signal.

---

## What's REMAINING

- **Phase 4 (in progress):** finish the 5 steps above — wire App, gallery CSS, GalleryScreen,
  verify, docs. KanbanLayout + TemplateBuilder are **already built and registered**; the
  `useTemplates` hook + `TemplatesScreen` are **already written**.
- **Out of scope this round (future tracks, per the ADR):** real persistence/AI/backend
  (everything is mocked/scripted now), migrating `apps/desktop` onto `ui-web`, consuming
  `ui-web` from a future `apps/web`, promoting `ui-web/src/model/*` types into `@needle/domain`.

---

## Architecture & file map

Two new workspaces. `ui-web` exports **source** (no build step needed to consume); studio
imports it via the workspace export map (`.`, `./styles`, `./model`).

### `packages/ui-web/src/`

**`model/`** — pure, framework-free, testable. **`model/index.ts` is the one barrel**
("every moving part"; a deliberate, documented exception to `typescript.mdc`'s no-barrel rule).
- `domain.ts` — re-exports `@needle/domain/domain-v2` (canonical `Item`, `ItemPlan`,
  `ItemOccurrence`, `ItemRelation`, `TodayItemView`, etc.). **Reuse these; don't fork.**
- `ids.ts`, `factory.ts` — branded ids + `mkItem/mkPlan/mkOccurrence/mkRelation`, `localTime`, etc.
- `template.ts` — `Template`, `TemplateRegistry`, `BUILTIN_TEMPLATES`, `effectiveLayout`,
  `DEFAULT_TEMPLATE_ID`. **The open/closed core.**
- `today.ts` — `TodayData`, `buildTodayView()` → `TodayItemView[]`, `childrenOf`, `effectiveStart`.
- `board.ts` — `groupViews()` + `sortViews()` (templates' sortBy/grouping → titled groups).
- `mutate.ts` — pure transforms: `toggleItemDone`, `setItemTitle`, `addChild`, `addItem`,
  `addEvent`, `addTravelPrep`, `pullYesterdayUnfinished`. Each returns NEW `TodayData`.
- `parse.ts` — `parseQuickAdd()` (mock "AI" for InlineAdd ✨).
- `time.ts` — clock/duration/countdown formatting.
- `countdown.ts` — `HardStop`, `deriveCountdown`, `alertStylePool`, `rotateAlertStyle`,
  `urgencyFor`, `nextHardStop`, `deriveHardStops`.
- `notify.ts` — `NotificationConfig`, `defaultNotificationConfig`, `inQuietHours`.
- `ritual.ts` — `createRitual/advanceRitual/ritualProgress/isRitualComplete/costOf`.
- `coach.ts` — `coachEngine()`, `AccountabilityMode`, `CoachNudge`, `Adherence`.
- `chat.ts` — `applyChat()`, `userMessage/assistantMessage`, `ChatMessage`.
- `revision.ts` — `RevisionLog` (append-only, `undo()` returns the before-snapshot).

**`primitives/`** — `Icon` (self-contained inline-SVG set), `Button`, `Checkbox`, `Pill`,
`ProgressBar`, `Divider`. Barrel: `primitives/index.ts`.

**`components/`** — feature components, barrel `components/index.ts`:
- Phase 1: `TodayBoard`, `ItemLine`, `InlineAdd`, `ProgressKudos`, `BoardContext`,
  `layouts/` (`EditorialLayout`, `CompactLayout`, `TimelineLayout`, `KanbanLayout`, `index.ts`
  with `LAYOUT_REGISTRY`, `types.ts` with `LayoutProps`).
- Phase 2: `Countdown`, `NotificationSettings`, `EventEditor`.
- Phase 3: `BrainDump`, `CoachPanel`, `ChatDock`, `RevisionTimeline`.
- Phase 4: `TemplateBuilder` (built). KanbanLayout (built, registered).

**`styles/`** — `primitives.css` (raw tokens), `tokens.css` (semantic, light+dark),
`base.css` (resets), `index.ts` (loads fonts + all CSS → `import '@needle/ui-web/styles'`).

### `apps/studio/src/`
- `main.tsx` (loads styles + App), `App.tsx` (rail nav + topbar clock + countdown badge +
  screen router — **needs Phase 4 wiring**), `theme.ts`, `clock.ts` (scenario clock, starts 9am),
  `templates.ts` (**new** — `useTemplates` localStorage-backed registry), `studio.css`.
- `mock/seed.ts` — canonical seed (standup, kids pickup, subtasked `task-123`, overdue invoice,
  remember note).
- `screens/` — `TodayScreen`, `AddScreen`, `EventsScreen`, `NotificationsScreen`,
  `BrainDumpScreen`, `CoachScreen`, `ChatScreen`, `RevisionsScreen`, `TemplatesScreen` (**new**).
  Missing: `GalleryScreen` (Step 3). Shared `screens.css` (**needs the Step 2 gallery classes**).

---

## Conventions & gotchas (learned the hard way)

Follow `.cursor/rules/*.mdc` — especially `design-tokens.mdc` (semantic tokens only, NO raw
hex, NO `--sand-*`/`--ink-*` primitives in components), `design-primitives.mdc`, `react.mdc`,
`typescript.mdc`, `testing.mdc`. Prettier: single quotes, semicolons, 2-space, 100 width,
es5 trailing commas. Each package has its own `eslint.config.mjs` + `lint` script.

Recurring pitfalls that cost time (avoid them):
1. **`React.X` namespace** (e.g. `React.CSSProperties`, `React.ReactNode`) → ESLint `no-undef`,
   because we use the JSX transform and don't import React. Use a **type import**:
   `import { type CSSProperties, type ReactNode } from 'react'`.
2. **Apostrophes**: in single-quoted TS strings escape or rephrase; in JSX text use `’`
   (curly) or `&apos;` — plain `'` trips `react/no-unescaped-entities`.
3. **`exactOptionalPropertyTypes` is ON.** Never assign `undefined` to an optional prop;
   build objects with conditional spreads: `...(x ? { x } : {})`.
4. **Token names**: it's `--radius-pill`, not `--radius-999`. Check `styles/primitives.css`
   for the real token list before using one.
5. **Scenario clock** starts at 09:00 today on purpose (otherwise the seeded hard stops are in
   the past at wall-clock time and the countdown shows "none ahead").
6. **Delegation worked well**: the presentational components (layouts, NotificationSettings,
   EventEditor, BrainDump, CoachPanel, RevisionTimeline, KanbanLayout, TemplateBuilder) were each
   built by a **Sonnet subagent** given the model contract + a reference component. The
   integration-heavy ones (ChatDock, TodayBoard, model layer, all studio wiring) were done by the
   main agent. Keep that split — give Sonnet a precise contract + a reference file + the rules.

---

## Decisions recap (full detail in the ADR)

D2 one canonical model; **templates are pure config** (never mutate data). D3 reuse
`@needle/domain`; new types in `ui-web/src/model` marked "promote later". D4 default template =
Editorial. D5 gallery **+** builder. D6 mock/scripted AI+coach+chat, no backend/LLM. D7 all AI
actions visible + attributed + **revertible**. D8 `apps/desktop` untouched. D9 the `model/index.ts`
barrel is the one allowed exception to the no-barrel rule.

Relevant existing `.cursor/skills/` playbooks for extending this: `needle-build-component`,
`needle-design-system`, `needle-add-token`, `needle-dark-mode-fix`, `needle-ui-audit`.
