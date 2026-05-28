# Needle

A calm **transition coach**: it catches you at the moment you switch from one
task or meeting to the next, makes you let go of the last thing (a quick
brain-dump), and starts you clean. Not a to-do app, not a timer. See
[`docs/positioning.md`](docs/positioning.md).

This repo is a **pnpm + Turborepo monorepo**. Today it holds the macOS desktop app
and the shared packages it builds on. The cloud surfaces (web, backend, mobile)
are a parallel track that gets added later — see
[`docs/v2/monorepo-migration-plan.md`](docs/v2/monorepo-migration-plan.md).

## Layout

```text
apps/
  desktop/        Electron + Vite + React macOS app (@needle/desktop)
packages/
  domain/         domain types, validation, business rules (@needle/domain)
  contract/       API/IPC contract shapes (@needle/contract)
  config/         shared tsconfig base (@needle/config)
docs/             product + architecture docs (start at docs/v2/README.md)
```

Planned next (not built yet): `apps/web` (Vite SPA), `apps/server` (NestJS +
Postgres), `apps/mobile` (Expo), `packages/{ui-web,api-client,design-tokens,ai}`.

## Tools / prerequisites

- **Node** 22.x
- **pnpm** 11.x (`corepack enable` or `npm i -g pnpm`) — this repo uses pnpm
  workspaces; npm/yarn are not supported here.
- **macOS** + Xcode command-line tools (for the Electron build + native
  `better-sqlite3`).
- A `.env` at the repo root for local AI (see `.env.example`):
  `ANTHROPIC_API_KEY=sk-ant-...`

## Run

```bash
pnpm install        # installs all workspaces; builds native modules
pnpm start          # launch the desktop app (delegates to @needle/desktop)
```

## Common scripts (run from the repo root)

| Command | What it does |
|---------|--------------|
| `pnpm start` | Launch the Electron desktop app in dev. |
| `pnpm run typecheck` | `turbo run typecheck` across all packages. |
| `pnpm run lint` | `turbo run lint`. |
| `pnpm run build` | `turbo run build`. |
| `pnpm run test` | `turbo run test`. |
| `pnpm run package` / `pnpm run make` | Build/package the desktop app (Electron Forge). |

Target one workspace directly: `pnpm --filter @needle/desktop <script>`.

## Where to read more

- **Product:** [`docs/positioning.md`](docs/positioning.md),
  [`docs/competitive-landscape.md`](docs/competitive-landscape.md).
- **Architecture:** [`docs/v2/README.md`](docs/v2/README.md) (index),
  [`docs/v2/monorepo-migration-plan.md`](docs/v2/monorepo-migration-plan.md).
- **Migration status / how this monorepo came to be:**
  [`docs/v2/migration-progress.md`](docs/v2/migration-progress.md).
- **Decision log:** [`memory/decisions.md`](memory/decisions.md).

## Conventions

- **Each app/package owns its stack-specific tooling.** When a new app is added
  (web/server/mobile), it gets its own `README.md` and its own
  `.cursor/rules` + `.cursor/skills` (and `CLAUDE.md` if needed) scoped to that
  folder. Repo-wide rules live at the root `.cursor/`.
- **Commit each green step** (`pnpm run typecheck && pnpm run lint` must pass).
