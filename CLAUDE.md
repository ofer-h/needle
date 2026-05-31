# Needle — agent guide (Claude)

A calm **transition coach**: catches you when you switch from one task/meeting to the
next, makes you let go of the last thing (a quick brain-dump), and starts you clean.
Not a to-do app, not a timer. Product framing: `docs/positioning.md`.

This file orients agents. The authoritative, enforced conventions live in
**`.cursor/rules/*.mdc`** (Cursor reads them automatically; you should read the ones
relevant to what you touch). This file points you at them and records the few things
that aren't obvious from the tree.

## Repo shape

pnpm + Turborepo monorepo. macOS desktop app + shared packages today; cloud surfaces
(web/server/mobile) are a parallel track added later.

```
apps/desktop      Electron + Vite + React macOS app (@needle/desktop)
apps/handbook     Astro handbook site (@needle/handbook)
apps/studio       browser demo for the new design system (@needle/studio)   ← new
packages/domain   domain types + business rules (@needle/domain)
packages/contract API/IPC contract shapes (@needle/contract)
packages/config   shared tsconfig base (@needle/config)
packages/ui-web   reusable web design system + model (@needle/ui-web)        ← new
docs/             product + architecture docs (start at docs/v2/README.md)
```

## Ground rules (read the rule file before editing in that area)

- **Tooling:** pnpm 11 + Node 22 only (npm/yarn unsupported). `pnpm-workspace.yaml`
  sets `nodeLinker: hoisted` (Electron needs it — don't remove). `build-and-tooling.mdc`.
- **TypeScript:** strict + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`.
  No `any`, no `!`, no `@ts-ignore`. Build optional props with conditional spreads.
  `typescript.mdc`.
- **React:** function components, `type Props`, named exports, no `React.FC`. `react.mdc`.
- **Design:** semantic tokens only, never raw hex; per-primitive folder; all
  interactive states; both light + dark must work. `design-tokens.mdc`,
  `design-primitives.mdc`, `design-components.mdc`, `design-dark-mode.mdc`.
- **Electron security/IPC:** contract-first IPC, `contextIsolation`, deny-by-default.
  `security.mdc`, `ipc.mdc`, `structure.mdc` (hard import boundaries main/preload/renderer).
- **Testing:** Vitest unit + component; bug fixes get a failing-first test. `testing.mdc`.
- **Scope & git:** do only what's asked; never touch lockfiles/forge/signing/CI without
  an explicit ask; imperative commit subjects ≤70 chars. `git-and-changes.mdc`.

## Memory & decisions (important)

- **`memory/context.md`** and **`memory/decisions.md`** are the project's running
  memory. Read them at session start; **append a dated entry to `memory/decisions.md`
  at session end** (`session-memory.mdc`). The two owners are **Ofer** and **Omri**.
- Heavier, stable-URL decisions go in **`docs/decisions/`** (ADR format — see its
  README) and are linked from `memory/decisions.md`.

## Reusable workflows

`.cursor/skills/` holds task playbooks worth following: `needle-build-component`,
`needle-design-system`, `needle-add-token`, `needle-token-migration`,
`needle-dark-mode-fix`, `needle-domain-architecture`, `needle-async-ux`,
`needle-observability`, `needle-debug-app-state`, `needle-ui-audit`,
`needle-design-review`.

## Current focus

- **Branch `v2-monorepo`:** the monorepo/platform refactor (`docs/v2/monorepo-migration-plan.md`).
- **Studio redesign (in progress):** a simpler, browser-viewable UI as
  `packages/ui-web` + `apps/studio`. One canonical model; templates are pure config.
  See `docs/v2/studio-redesign.md`, the ADR `docs/decisions/2026-05-31-ui-web-studio-redesign.md`,
  and `.cursor/rules/ui-web.mdc`. `apps/desktop` is untouched by that work for now.

## Run

```bash
pnpm install
pnpm start                              # boot the desktop app (@needle/desktop)
pnpm --filter @needle/studio dev        # the design-system demo in a browser
pnpm typecheck && pnpm lint             # all workspaces (turbo)
```
