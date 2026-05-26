# Phase 2 — Full Design System Buildout

**Date:** 2026-05-26
**Driven by:** Ofer (asked for consolidated, no-piecemeal plan with reusable components)
**Prerequisite:** Phase 1 AI-first foundation merged (rules + skills + docs). See `docs/superpowers/specs/2026-05-26-needle-design-system-design.md`.
**Parallel work:** `needle-ui-audit` running in another session — its findings refine the inventory in `design/components.md` and will feed Phase 2c (extraction list).

## Goal

Take Needle from "UI MVP with mixed inline styles and broken dark mode" to **production-grade design system with a reusable component library**. One coherent plan, executed in linear phases. Each phase is reviewable before the next starts — no big-bang merge, but no piecemeal scope creep either.

## What "reusable component library" means here

A new folder `src/renderer/components/primitives/`. Every primitive in there is:

- Self-contained: one folder per primitive (`primitives/Button/`).
- API-first: `type Props` defined before JSX.
- Variant-driven: tone/size/intent expressed as union types, not boolean flags.
- State-complete: default, hover, focus-visible, active, disabled, loading where relevant.
- Token-pure: only semantic tokens. Zero raw hex.
- Documented: entry in `design/components.md` with usage and consumers.
- Reusable: imported from `@/components/primitives/Button` (or path equivalent) across every screen.

## Scope (consolidated, no piecemeal)

### In scope

1. **Token restructure** — split `tokens.css` into primitive + semantic layers; add missing tokens (`surface-active`, `border-strong`, `icon-default`, `icon-muted`, `disabled-*`).
2. **Dark mode contrast fix** — bring failing pairs to WCAG AA + leave 1.0:1 headroom.
3. **Primitive library** — extract reusable primitives from current inline usage.
4. **Domain refactor** — `TaskRow`, `EventRow`, `Section` consume primitives.
5. **Screen refactor** — `TodayScreen`, `CaptureScreen` consume primitives.
6. **Dev infra** — Ladle for component dev; a contrast-check vitest.
7. **Anti-pattern cleanup** — zero raw hex in `.tsx`, zero off-scale spacing.

### Out of scope (Phase 3 or later)

- Cross-platform (web/mobile/iOS) — defer until macOS is solid.
- Visual regression cloud SaaS (Chromatic etc.) — local-first only.
- New product features — this is a refactor, not a feature ship.
- Backend / AI / DB — separate effort.
- Style framework swap (Tailwind, vanilla-extract) — explicitly NOT happening.

## End-state architecture

```
src/renderer/
  components/
    primitives/                ← NEW — reusable design-system primitives
      Button/
        Button.tsx
        Button.css             ← only if Button needs its own CSS rules
        index.ts               ← re-export
      Chip/
      Pill/
      Checkbox/
      Icon/                    ← wrapper around current Icons.tsx with semantic colors
      IconButton/
      Kbd/
      Card/
      EmptyState/
      Toast/
      Divider/
      ProgressBar/
    Today/                     ← existing, refactored to use primitives
      TaskRow.tsx
      EventRow.tsx
      Section.tsx
      TodayScreen.tsx
    Capture/
      CaptureScreen.tsx
    Window/
      FxWindow.tsx
      Titlebar.tsx
    Icons.tsx                  ← stays as the raw SVG set, consumed by primitives/Icon
  styles/
    primitives.css             ← NEW — primitive (raw value) tokens, --sand-50 etc.
    tokens.css                 ← semantic + accent tokens, light + dark
    global.css                 ← resets only; component CSS moved to primitive folders
```

## Linear phase sequence

Each phase is its own approval gate. I propose the diff → Ofer reviews → I implement → typecheck + lint pass → docs updated → move on.

### Phase 2a — Token foundation (one PR's worth)

- Restructure `tokens.css`:
  - Add a new `primitives.css` for raw values (named after the palette: `--sand-50`, `--ink-50`, `--urgent-base`, etc.).
  - `tokens.css` becomes pure semantic-token definitions.
- Add semantic tokens that are currently missing:
  - `--surface-active`, `--border-strong`, `--icon-default`, `--icon-muted`, `--ink-disabled`, `--surface-disabled`.
- Apply the dark-mode contrast fix per `needle-dark-mode-fix` calculations in `design/tokens.md`.
- Verify: every pair used in components passes WCAG AA.
- Update `design/tokens.md` to mark migration items complete.

**Verification:** Visual smoke test in both themes; contrast assertion script.

### Phase 2b — Icon system + Icon primitive

- Keep `Icons.tsx` as the raw SVG set (used `currentColor`).
- New primitive `primitives/Icon/` that wraps any icon with a semantic color:
  ```tsx
  type Props = {
    children: ReactNode;        // the raw <IconX /> from Icons.tsx
    tone?: 'default' | 'muted' | 'accent' | 'urgent' | 'upcoming';
    size?: 'sm' | 'md' | 'lg';
  };
  ```
- Tone maps to `--icon-default`, `--icon-muted`, `--accent`, `--urgent`, `--upcoming`.
- Update every direct `<IconX color="..." />` usage to `<Icon tone="..."><IconX /></Icon>`.

### Phase 2c — Atomic primitives

In order of payoff:

1. **Button** — variants: `primary`, `secondary`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. Optional `iconLeft`, `iconRight`, `kbd` for keyboard hint.
2. **IconButton** — icon-only; same variant set; required `aria-label`.
3. **Chip** — variants: `default`, `outline`, `urgent`, `upcoming`, `gold`. Selectable + dismissible variants.
4. **Pill** — for dates and small badges. Variants: `default`, `urgent`, `upcoming`. Optional `iconLeft`.
5. **Checkbox** — circular task variant + standard variant. `kind` for urgent/upcoming/faded styling. `done` state.
6. **Kbd** — keyboard hint (`⌘ N`). Just typography + token + monospace.
7. **Divider** — horizontal hairline, optional `dotted` variant.

Each primitive: one folder, props type, variants, full state coverage, only semantic tokens, entry in `design/components.md`.

### Phase 2d — Composite primitives

1. **Card** — container with `--shadow-card`, `--border-default`, `--surface-raised`. Used by `composer`, `result-card`, `expanded`.
2. **EmptyState** — illustration slot + headline + description + CTA. Aligns with `ui-design-brain` best practice.
3. **Toast** — auto-dismiss, manual dismiss, intent variants. Placeholder skill — wire to real notifications in Phase 3.
4. **ProgressBar** — track + fill, intent variants.

### Phase 2e — Domain component refactor

- `TaskRow` consumes `Checkbox`, `Pill`, `Icon`.
- `EventRow` consumes `Icon`, `Pill`.
- `Section` is already clean — verify it still is.
- Extract any remaining inline style blocks > 2 properties into either a primitive or a CSS class.

### Phase 2f — Screen refactor

- `TodayScreen` consumes `Button`, `Kbd`, `Icon`, `ProgressBar`, `Section`.
- Sub-toolbar with date + progress + Add-task becomes its own component (`TodayToolbar`).
- `CaptureScreen` consumes `Button`, `Chip`, `Card`, `Icon`. Split the 4 states into separate files under `Capture/states/`.
- The 626-line `TodayScreen.tsx` should drop to under 200 lines.

### Phase 2g — Dev infrastructure

- Install `@ladle/react` (devDependency).
- Add `npm run ladle` script.
- Add `.ladle/config.mjs` with theme switcher + decorator that wraps stories in `<FxWindow>`-style chrome.
- For each primitive, add a `<Name>.stories.tsx` with one story per variant + state.
- Add a `vitest` test file `src/renderer/styles/__tests__/contrast.test.ts` that asserts every semantic token pair used in components passes WCAG AA.

### Phase 2h — Validation pass

- Run `npm run typecheck` — must pass.
- Run `npm run lint` — must pass.
- Run `npm run test` — contrast test must pass.
- Manual smoke test of Today and Capture screens in both themes.
- Final audit: grep for raw hex in `src/renderer/components/**/*.tsx` — must be zero.
- Update `design/components.md` to reflect all primitives at `ready` status.
- Update `design/decisions.md` and `memory/decisions.md` with Phase 2 summary.

## Working agreement (how Ofer and I run this)

- **One phase per chat session.** Don't try to do 2a + 2b + 2c in one go. Each phase ends with a verifiable artifact.
- **Diff-before-edit on high-stakes changes.** Token edits and primitive APIs: I show the diff or proposed shape, Ofer approves, I apply.
- **Typecheck + lint after every phase.** No "I'll fix lints later."
- **Update docs as we go.** `design/components.md` and `design/tokens.md` are living docs — keep them current with each phase.
- **No scope creep.** If a phase reveals a new gap, log it in `design/decisions.md` and decide whether to handle now or defer.

## Skills involved at each phase

| Phase | Skill | Notes |
|-------|-------|-------|
| 2a | `needle-dark-mode-fix` + `needle-add-token` | Token restructure + contrast |
| 2b | `needle-build-component` | Icon wrapper primitive |
| 2c | `needle-build-component` (per primitive) | Atomic library |
| 2d | `needle-build-component` (per primitive) | Composite library |
| 2e | `needle-token-migration` + `needle-build-component` | Domain refactor |
| 2f | `needle-token-migration` + screen refactor | Screen consumers |
| 2g | Manual + `needle-build-component` for stories | Ladle setup |
| 2h | `needle-design-review` | Final review pass |

## Success criteria

- `src/renderer/components/primitives/` exists with at least 11 reusable primitives.
- Zero raw hex in `src/renderer/components/**/*.tsx`.
- WCAG AA passes on every token pair used in components (verified by test).
- `TodayScreen.tsx` and `CaptureScreen.tsx` use only primitives + domain components; no inline style blocks with > 2 properties.
- Ladle runs and shows every primitive with every variant.
- Future agent sessions can build a new component end-to-end using `needle-build-component` without re-explaining the system.

## Risks

| Risk | Mitigation |
|------|------------|
| Big refactor breaks the running app | One phase per session; typecheck + smoke test after each |
| Primitives end up over-flexible (god components) | Cap variants at 4. If you need more, split the primitive. |
| Design intent drifts from current look | `Section`, hairlines, chip colors are baseline truth — don't redesign during the refactor |
| Ladle dependency adds friction | Lock to a specific version; only used as devDependency |
| Audit (parallel session) finds blockers | Read its output before Phase 2a; revise scope if needed |

## Open questions

- Should each primitive have a co-located `.css` file or stick with shared `global.css`? (Recommend: co-located CSS per primitive — better encapsulation.)
- Theme switcher: do we expose an in-app toggle in this phase, or keep relying on the system theme? (Recommend: in-app toggle, since Ladle will have one anyway.)
