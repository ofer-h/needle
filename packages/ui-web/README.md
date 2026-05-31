# @needle/ui-web

The reusable web design system: tokens + fonts, slim primitives, the canonical
model re-exports + new presentation/logic types, the template registry, and the
feature components. This is the layer that `apps/studio` demos today and
`apps/web` will consume. See [`docs/v2/studio-redesign.md`](../../docs/v2/studio-redesign.md).

## Consuming the package

```ts
// Once at app root — loads tokens, fonts, base reset:
import '@needle/ui-web/styles';

// Components:
import { TodayBoard, ItemLine, Countdown } from '@needle/ui-web';

// Pure model types + logic (no React):
import type { Template, TodayData, CountdownState } from '@needle/ui-web/model';
import { buildTodayView, deriveCountdown } from '@needle/ui-web/model';
```

## Exports (subpaths)

| Subpath | Contents |
|---------|----------|
| `.` (default) | All feature components |
| `./styles` | `src/styles/index.ts` — tokens, fonts, base reset; side-effect import |
| `./model` | `src/model/index.ts` — the one intentional barrel: every type and pure function |

The `model/index.ts` barrel is a deliberate exception to the repo's no-barrel rule.
A publishable package's curated public surface is the opposite need from the
Electron renderer. See the note in `studio-redesign.md` and `.cursor/rules/ui-web.mdc`.

## Model layer (`src/model/`)

Pure TypeScript — no React, no I/O — so every module is unit-testable with Vitest.
Entities from `@needle/domain` are re-exported via `src/model/domain.ts`. New
UI-driven types (`Template`, `TodayData`, `CountdownState`, `CoachNudge`, …) live
here with a "promote into @needle/domain once validated" comment.

## Scripts

| Command | What it does |
|---------|--------------|
| `typecheck` | `tsc --noEmit` |
| `test` | Vitest — pure model logic |
| `build` | publishable lib build |

## Rules

- **Semantic tokens only** — `var(--ink)`, `var(--surface)`, `var(--urgent)`.
  Never raw hex; never `--sand-*`/`--ink-*` primitives in components.
- **Templates are pure config** — switching a template never mutates item data.
- **Platform-agnostic model** — `src/model/*` has no React or I/O imports.

Full conventions: [`.cursor/rules/ui-web.mdc`](../../.cursor/rules/ui-web.mdc).
