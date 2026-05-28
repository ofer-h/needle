# Monorepo Migration — Progress Ledger

Live status of the Foundation migration on branch `v2-monorepo`. Plan:
[`monorepo-migration-plan.md`](./monorepo-migration-plan.md).

**Scope this pass:** Foundation only (F0–F3) + docs + per-app rules/skills. Track B
(web / backend / mobile) is scaffolded next — see "Next steps handy" below.

**Safety net:** the last known-good Electron app is on `master`. If `v2-monorepo`
breaks, `git checkout master` gives you a working app immediately.

**Verification limits (read this):** this migration was executed by an agent that
**cannot launch the Electron GUI** (no display) and **cannot run the SQLite tests**
(better-sqlite3 is built for Electron's ABI, not host Node). So each step is
verified by `typecheck` + `lint` + (where possible) a build. **You must run the
runtime smoke-test** — see "Final verification checklist".

Status legend: ⬜ not started · 🟡 in progress · ✅ green (committed) · ❌ broken.

---

## Step ledger

| Step | What | Verify | Status |
|------|------|--------|--------|
| F0 | pnpm workspaces + Turborepo + `packages/config` + `.npmrc`; npm→pnpm | `pnpm run typecheck && pnpm run lint` | ⬜ |
| F1 | Extract `packages/domain` + `packages/contract` from `src/shared` | `pnpm run typecheck` | ⬜ |
| F2 | Move Electron app → `apps/desktop`; fix forge/vite/tsconfig + `.env` | `pnpm run typecheck` + build | ⬜ |
| F3 | Extract `packages/ui-web` + `packages/design-tokens` | `pnpm run typecheck` | ⬜ |
| R  | Redistribute `.cursor` rules/skills per-app | n/a (docs) | ⬜ |
| D  | READMEs (root + every folder) | n/a (docs) | ⬜ |
| P  | Push `v2-monorepo` | `git push` | ⬜ |

Each step is its own commit. To see them: `git log --oneline master..v2-monorepo`.

---

## Per-step detail (how to re-run / revert)

Generic revert of a single step: find its commit and revert just that one.
```bash
git log --oneline master..v2-monorepo      # find the step's commit
git revert <sha>                            # undo one step, keep the rest
# or, to throw away everything since master and start the pass over:
git reset --hard master                     # DESTRUCTIVE — only if you mean it
```

### F0 — pnpm + Turborepo
- Adds `pnpm-workspace.yaml`, `turbo.json`, `.npmrc` (`node-linker=hoisted`, required
  so Electron can rebuild native `better-sqlite3` under pnpm), `packages/config`.
- Switches the lockfile: `pnpm import` (from `package-lock.json`) then `pnpm install`.
- Re-run: `pnpm install`. Verify: `pnpm run typecheck && pnpm run lint`.
- If native modules misbehave at runtime: confirm `.npmrc` has `node-linker=hoisted`,
  then `pnpm install` again. Last resort: fall back to npm workspaces.

### F1 — domain + contract packages
- `packages/domain` ← `domain-v2.ts`, `types.ts`, `flow-health.ts`.
- `packages/contract` ← `ipc-contracts.ts`.
- ~31 import sites rewritten from relative `shared/...` to `@needle/domain` /
  `@needle/contract`.
- Re-run: `pnpm run typecheck`. If an import was missed, the error names the file.

### F2 — move desktop
- `git mv` the app (src, index.html, vite/tsconfig/forge/vitest configs, app
  `package.json`) into `apps/desktop`. Root `package.json` becomes the private
  workspace root.
- `.env` fix: `load-env.ts` now walks up to find the repo-root `.env` so the dev
  API key still loads from `apps/desktop`.
- Re-run dev: `pnpm --filter @needle/desktop start` (or `cd apps/desktop && pnpm start`).

### F3 — ui-web + design-tokens
- `packages/ui-web` ← shared renderer components; `packages/design-tokens` ← tokens.
- Components stay transport-agnostic (data via props/context), so web can reuse them.

---

## Final verification checklist (yours to run)

After the pass, confirm the runtime the agent couldn't:

```bash
pnpm install
pnpm --filter @needle/desktop start     # app window opens
```
- [ ] App launches (window appears).
- [ ] Today view loads data (SQLite read works → native module OK).
- [ ] Add/reorder a task; restart; data persists (SQLite write works).
- [ ] Capture → AI classify returns blocks (`.env` API key loaded).
- [ ] `pnpm run typecheck` and `pnpm run lint` pass from the repo root.

If any fail, the failing step's commit is isolated — revert just that one (above),
or run from `master` while we fix it.

---

## Next steps handy — Track B kickoff (not done this pass)

When you greenlight Track B, scaffold each app in its own folder against the shared
spine (`@needle/domain`, `@needle/contract`, and for web `@needle/ui-web`). One
agent per app; each is independent so they can run in parallel.

- **`apps/server`** — NestJS + Postgres. Implements `packages/contract` via the
  ts-rest Nest adapter. Modules: Auth (better-auth), Access (authz), Workspace,
  Items, Planning, Flow, Capture/AI (lift `classify.ts` into `packages/ai`).
- **`apps/web`** — Vite + React SPA. Uses `packages/api-client` (ts-rest client) +
  `packages/ui-web` + `packages/domain`. Login + Today via the API.
- **`apps/mobile`** — Expo. Shares `domain` + `api-client`; native UI in
  `packages/ui-native`. Deferred; voice capture + notifications are the wedge.

### Per-app rules/skills convention (do this when scaffolding each app)

Each app/package owns the rules and skills specific to its stack, so an agent (or
human) working in that folder gets the right guidance automatically:

- Put stack-specific Cursor rules in `<app>/.cursor/rules/*.mdc` and skills in
  `<app>/.cursor/skills/*/SKILL.md`. Repo-wide rules stay at the root `.cursor/`.
- Examples to add when each app is created:
  - `apps/server`: NestJS module/provider conventions, ts-rest contract-first,
    better-auth provider-agnostic identity, authz-on-internal-userId, Postgres/migrations.
  - `apps/web`: Vite SPA, transport-agnostic UI consumption, api-client usage, auth/session.
  - `apps/mobile`: Expo/React Native conventions, ui-native, notifications, offline capture.
- Every app/package also gets its own `README.md` (purpose, how to run/build) and,
  where it needs agent guidance, its own `CLAUDE.md`.
