# @needle/desktop

The Needle macOS desktop app — Electron + Vite + React + TypeScript, with local
SQLite (`better-sqlite3`) persistence. This is **Path A** of the two-path plan:
standalone and local-first, no backend required (see
[`../../docs/v2/monorepo-migration-plan.md`](../../docs/v2/monorepo-migration-plan.md)).

## Run

From the repo root (preferred, so workspace linking is correct):

```bash
pnpm install
pnpm start                       # or: pnpm --filter @needle/desktop run start
```

Or from this folder: `pnpm start`.

## Scripts

| Command | What it does |
|---------|--------------|
| `start` | `electron-forge start` — dev app with HMR. |
| `package` | `electron-forge package` — unsigned app bundle. |
| `make` | `electron-forge make` — DMG/ZIP installers (needs signing env). |
| `lint` | `eslint src/`. |
| `typecheck` | `tsc` for main, preload, and renderer projects. |
| `test` | `vitest` (note: SQLite tests need Electron's ABI). |

## Structure

```text
src/
  main/       Electron main process — DB (SQLite), AI, IPC handlers, windows
  preload/    context-isolated IPC bridge (window.api)
  renderer/   React UI (components, state/zustand, hooks, styles)
index.html    renderer entry
forge.config.ts, vite.*.config.ts, tsconfig.*.json
```

Data boundary: the renderer talks to the main process via `window.api`
(preload IPC). That boundary is also the future "connect to backend" seam — when
the cloud API is ready, the main process implementation behind those handlers
swaps to call the API + cache, and the renderer doesn't change.

## Local AI / `.env`

In dev, the app loads the repo-root `.env` (walks up to find
`pnpm-workspace.yaml`) for `ANTHROPIC_API_KEY`. See `../../.env.example`. No key →
AI capture is disabled, the rest of the app still works offline.

## Shared packages

Imports domain types from `@needle/domain` (`/types`, `/domain-v2`,
`/flow-health`) and IPC shapes from `@needle/contract`.
