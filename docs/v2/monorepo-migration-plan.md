# Monorepo Migration Plan

Concrete execution plan for splitting Needle into a multi-app monorepo with a
NestJS/Postgres backend. This document pins the tech decisions and ordered steps.

The delivery model is **two paths over one shared core** (see "Delivery Model"
below): the macOS app keeps running standalone and local-first so its development
is never blocked, while the cloud stack (backend + auth + web + mobile) is built in
parallel as its own track. Both paths consume the same domain model, so connecting
them later is a sync adapter, not a rewrite.

It does **not** replace the existing direction docs — it implements them:

- `architecture-guidelines.md` — engineering guardrails (still authoritative).
- `multi-app-roadmap.md` — the ring strategy and target repo shape.
- `data-model.md` — Postgres schema the server must match.
- `sync-access-observability.md`, `sync-and-web.md` — sync/access model.

Branch: `v2-monorepo`. Decision owner: Ofer (2026-05-28).

## Locked Decisions

The repo already chose the destination; these pin the remaining tech.

| Area | Decision | Notes |
| --- | --- | --- |
| Delivery model | **Two paths, one shared core** | Mac runs standalone/local; cloud (BE+web+mobile) runs as a parallel track; connect later via a sync adapter. |
| Data model | **Mac: local-first. Cloud: server-of-record** | Mac's SQLite and the BE's Postgres are two storage representations of one shared domain model. |
| Users | **Multi-user product (cloud path)** | Accounts + per-user isolation in the cloud path. Mac's local data is already actor/workspace-scoped, so it maps onto a real account when connected. |
| Backend | **NestJS modular monolith + Postgres** | Module list per `architecture-guidelines.md` §5. |
| API contract | **ts-rest** | One `packages/contract`, end-to-end types, no codegen. Evolves `src/shared/ipc-contracts.ts`. |
| Auth | **better-auth**, provider-agnostic | Internal `userId` is the only identity business logic sees. |
| Authz | **Separate from authn** | Ownership/role checks on internal `userId`; never trust the auth provider for permissions. |
| Web | **Vite + React SPA** | Maximizes UI sharing with the Electron renderer. Not Next.js. |
| Mobile | **Expo, deferred** | Share types/api-client/domain; native UI later. |
| Tooling | **pnpm workspaces + Turborepo** | Adopt from the start (deviates from the docs' "keep npm" default). |

## Delivery Model: Two Paths, One Shared Core

This is the organizing principle of the whole plan. The product ships as two
independent paths that share a single domain core, so neither blocks the other.

```text
                    ┌─────────────────────────────┐
                    │      SHARED CORE (spine)     │
                    │  domain · contract · ui ·    │
                    │  design-tokens               │
                    └──────────────┬──────────────┘
                ┌──────────────────┴──────────────────┐
        ┌───────▼────────┐                   ┌─────────▼─────────┐
        │   PATH A: Mac  │                   │   PATH B: Cloud   │
        │  standalone    │   ...later...     │  BE + auth + web  │
        │  local SQLite  │◄═══ sync adapter ═│  + mobile         │
        │  never blocked │                   │  Postgres (truth) │
        └────────────────┘                   └───────────────────┘
```

- **Path A — macOS (standalone, ongoing).** Stays exactly as today: local SQLite,
  fully offline-capable, no backend dependency. Development never waits on the
  server. This is where the core logic and MVP keep moving.
- **Path B — Cloud (parallel track).** Backend (NestJS + Postgres), auth, web, and
  mobile, built as one coherent stack on its own clock. Server-of-record: Postgres
  is the source of truth for this path.
- **Bridge (deferred).** When endpoints are stable, the Mac app gains an optional
  login + **sync adapter** that maps its local store onto the contract. It keeps
  working standalone if offline or signed out.

### Why the two paths stay one product (the guardrail)

The failure mode of "two paths, sync later" is **model divergence**: the Mac app
and the backend grow two different notions of a Task/Item, and "connect later"
becomes a reconciliation rewrite. The cheap, one-time prevention:

**Both paths consume the same shared domain model** (`packages/domain` +
`packages/contract`). Same entities, same validation, same business rules. The
Mac's SQLite and the BE's Postgres are two *storage representations of one model*,
not two models. When that holds, the bridge is a sync adapter measured in weeks,
not a rewrite.

Head start: the existing v2 schema already scopes data to `workspaces` and
`actors`, so Mac-local data is already multi-user-shaped. When connected, it maps
onto a real account instead of needing a single-user assumption ripped out.

### Two seams that make this work

1. **Transport-agnostic UI.** `packages/ui-web` components receive data + callbacks
   (props/context). They never know whether data came from `window.api` (Mac,
   local) or the API client (web, remote). Each app wires its own data source into
   the same components. This is what lets web and Mac stay "mostly the same."
2. **The Mac's existing IPC boundary is its connect seam.** The renderer already
   talks to the main process via `window.api` (preload). To connect later, change
   what the main process does *behind* those handlers (call API + cache instead of
   SQLite-only); the renderer does not change. The bridge flips features one at a
   time as endpoints stabilize.

Full bidirectional local-first sync (the outbox/conflict model in
`architecture-guidelines.md`) is a later concern; do not pick a sync vendor before
the cloud operation model is proven.

## Target Repo Shape

`[spine]` marks the shared core both paths depend on — the anti-divergence guardrail.

```text
apps/
  desktop/        # PATH A: existing Electron app (main + preload + renderer shell)
  web/            # PATH B: Vite + React SPA — same UI as desktop
  server/         # PATH B: NestJS modular monolith + Postgres
  mobile/         # PATH B: later, Expo

packages/
  domain/         # [spine] types, validation, business rules (from src/shared)
  contract/       # [spine] ts-rest API contract (evolves ipc-contracts.ts)
  ui-web/         # [spine] transport-agnostic React DOM components (desktop + web)
  design-tokens/  # [spine] tokens → CSS + (later) React Native
  db-schema/      # Postgres schema + migrations (server) per data-model.md
  api-client/     # typed client wrapping the contract (web/mobile/desktop-connected)
  ai/             # provider-agnostic AI/prompt logic (from src/main/ai)
  config/         # shared tsconfig / eslint
```

## Backend Module Map

NestJS modular monolith (`architecture-guidelines.md` §5), with authn/authz split:

- `AuthModule` — better-auth integration; sessions; provider linking. **Authn only.**
- `AccessModule` — authorization policy service: ownership/membership/role checks
  on internal `userId`. Deny-by-default. **Authz only, never calls the provider.**
- `WorkspaceModule`, `ItemsModule`, `PlanningModule`, `FlowModule`
- `CaptureModule` / AI — lift `src/main/ai/classify.ts` here; web + desktop call it via API.
- `SyncModule`, `NotificationsModule`, `SuggestionsModule`, `IntegrationsModule`,
  `TelemetryModule` — stubbed/deferred per ring.

## Auth & Identity Design

The hard rule: **business logic depends on an internal User, not on a provider.**

```text
users               # internal identity: id (our userId), display fields
auth_identities     # (provider, provider_user_id, user_id) — linked logins
                    #   e.g. ('google', '…', user_id), later ('okta', …)
```

- better-auth handles authentication and writes/reads `auth_identities`.
- App code only ever sees `users.id`. Swapping/adding an OAuth provider
  (Okta/Auth0/etc.) touches `AuthModule` + `auth_identities` only — zero business
  logic changes.
- Every API handler authorizes via `AccessModule` using the internal `userId`
  (ownership/membership/role). The auth provider is never consulted for permissions.

## API Contract (ts-rest)

- `packages/contract` defines the REST contract once (Zod-validated I/O).
- `apps/server` implements it via the ts-rest NestJS adapter.
- `packages/api-client` consumes it for fully-typed calls — no codegen step.
- This is the direct successor to `src/shared/ipc-contracts.ts`: the same
  request/response shapes, transported over HTTP instead of IPC.

## Phased Migration Sequence

Organized as **Foundation → two parallel tracks → bridge**. Foundation comes
first because it builds the shared spine that unblocks both tracks. Each phase is
one green commit (`typecheck`, `lint`, app still starts). Follow the recovery rules
in `architecture-guidelines.md` (`git mv`, one context at a time, revert the
migration commit — never user work — if a move goes sideways).

### Foundation — the shared spine (do first)

Builds the monorepo and the spine packages. The Mac app keeps working throughout.

**F0 — Tooling.** pnpm workspaces + Turborepo + `packages/config`. App untouched.
  - Exit: `turbo run typecheck lint` works; `pnpm start` runs the Electron app.

**F1 — Extract domain + contract.** `packages/domain` (types/validation/business
rules from `src/shared`) and `packages/contract` (ts-rest spec, no server yet).
Electron imports `@needle/domain`.
  - Exit: both packages typecheck independently; Electron still runs; no UI rewrite.

**F2 — Move desktop.** `git mv src/ → apps/desktop/src/`; fix Vite/Forge/TS configs.
  - Exit: Electron app builds and starts from `apps/desktop`, standalone, unchanged.

**F3 — Extract UI + tokens.** `packages/ui-web` (transport-agnostic components from
`renderer/components`) + `packages/design-tokens`. Desktop consumes them.
  - Exit: Electron still runs using the shared UI package; components take data via
    props/context, not direct `window.api` calls.

### Track A — macOS (standalone, ongoing)

Not a migration phase, this is business-as-usual after Foundation. Keep building
core logic and MVP features on the standalone Mac app, on local SQLite, consuming
the shared spine. No backend dependency. Never blocked.

### Track B — Cloud (parallel, on its own clock)

Built against the shared spine; can proceed against a mock of `contract` before the
real server exists, so web work never waits on the backend.

**B1 — Backend.** `apps/server` (NestJS + Postgres) implementing `contract`.
Modules: Auth (better-auth), Access (authz), Workspace, Items, Planning, Flow,
Capture/AI (lift `classify.ts` into `packages/ai`). Postgres expresses the same
domain model; migrations in `packages/db-schema`.
  - Exit: server boots; auth works; an authenticated user can CRUD items via the
    contract; cross-user access is rejected by `AccessModule`.

**B2 — Web.** `packages/api-client` + `apps/web` (Vite SPA) on shared `ui-web` +
`domain`: login + Today read/write through the API.
  - Exit: web views/edits Today for one account; reuses the shared UI; no second
    task model invented.

**B3 — Mobile.** `apps/mobile` (Expo) + `packages/ui-native`. Shares `domain` +
`api-client`; native UI. Voice capture + notifications are the mobile-first wedge.
  - Exit: mobile supports the core daily loop (capture, Today/Now/Next), not full parity.

### Bridge — connect Mac to cloud (deferred)

Tractable because both sides share the domain model and the Mac data is already
actor/workspace-scoped.

- Add optional login to the Mac app and a **sync adapter** behind the existing
  `window.api` handlers: read/write the API + local cache instead of SQLite-only.
- Flip features over one at a time as endpoints stabilize. Standalone-local stays
  the fallback when offline or signed out.
- Full bidirectional local-first sync (outbox/conflict) only after the cloud
  operation model is proven.

## Open Questions

- Postgres host for private beta (local/VPS vs managed) — see `multi-app-roadmap.md` cost rings.
- Exact better-auth provider set for v1 (email + Google?).
- Sync conflict model for the Bridge (last-write-wins vs. operation log) — defer
  until the cloud operation model is proven; the Mac keeps standalone fallback regardless.
