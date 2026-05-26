# Multi-App Roadmap

This roadmap keeps Needle moving forward without turning one developer into a platform team too early.

## Strategy

Build in rings:

1. Mac product loop.
2. Local persistence and recoverability.
3. Shared domain package.
4. Server-backed sync.
5. Web app.
6. Mobile app.
7. Dedicated coach/accountability surfaces.

Each ring must produce something testable with real usage. Do not build the next ring just because it is architecturally exciting.

## Macro Roadmap

### Ring 0 - Current app stabilization

Goal: the running macOS app proves the daily-flow product shape.

Deliver:

- Today timeline remains stable.
- Inline editing remains stable.
- Current focus card/state.
- Transition affordance.
- Lightweight completion reflection.
- First-class subtasks as child items in the store.
- Calm suggestion placeholder, even before AI.

Exit criteria:

- Ofer can use it for a real day.
- No runtime branch of the UI depends on embedded `Subtask[]`.
- The product can answer "what should I focus on right now?"
- `npm run typecheck` and `npm run lint` are clean.

### Ring 1 - Local persistence

Goal: stop treating product data as mock UI state.

Deliver:

- Local SQLite database.
- Migration runner.
- Repository layer in Electron main process.
- Typed IPC commands/queries.
- Domain selectors that derive Today and Daily Flow views.
- Local `activity_log`.
- Local `sync_operations` outbox, even before cloud.
- Export/import workspace backup.

Exit criteria:

- App restart preserves data.
- A failed write cannot silently corrupt UI state.
- Export/import round trip works on a fresh local database.
- Repository tests cover item creation, planning, child items, flow session, and reflection.

### Ring 2 - Shared package extraction

Goal: prepare for server/web/mobile with low-risk extraction.

Deliver:

- `packages/domain` with:
  - domain types
  - validation schemas
  - command shapes
  - selectors
  - date/time helpers
- Electron imports domain package instead of local `src/shared/domain-v2.ts`.
- `packages/design-tokens` with tokens exportable to CSS and React Native.

Exit criteria:

- Electron app still runs.
- Domain package typechecks independently.
- No Electron main/preload/renderer boundary is weakened.
- No UI rewrite yet.

### Ring 3 - Monorepo and backend

Goal: introduce cloud without breaking local-first.

Deliver:

```text
apps/desktop
apps/server
packages/domain
packages/db-schema
packages/design-tokens
```

Server:

- NestJS modular monolith.
- Postgres.
- Auth.
- Access policy service.
- Operation ingestion.
- Changes feed.
- Health endpoint.
- OpenAPI docs for core endpoints.

Exit criteria:

- Desktop can sync one personal workspace to server.
- Server rejects unauthorized cross-workspace operations.
- Local app still works offline.
- Full reset/reseed of dev server is documented.

### Ring 4 - Web app

Goal: web access to the same daily-flow model.

Deliver:

- `apps/web`.
- Same domain selectors.
- Same design tokens.
- Today timeline read/write through server API.
- Login/account flow.
- Basic responsive layout.

Preferred first web stack:

- Vite + React app if it is purely authenticated app UI.
- Next.js only if we also need server-rendered marketing/docs, SEO, or a combined app/router deployment.

Exit criteria:

- Web can view and edit Today for one account.
- Desktop and web converge through sync.
- Web does not invent a second task model.

### Ring 5 - Mobile app

Goal: mobile capture, review, notifications, and lightweight flow.

Deliver:

- `apps/mobile` with Expo.
- Shared `packages/domain`.
- Shared `packages/design-tokens`.
- Native mobile components in `packages/ui-native`, not forced reuse of DOM components.
- Capture.
- Today/Now/Next.
- Local notifications.
- Optional push after server/device registration.

Exit criteria:

- Mobile supports the core daily loop, not full desktop parity.
- Mobile can capture and reorder essentials.
- Notifications obey preferences and quiet hours.
- Offline behavior is acceptable for capture and Today review.

### Ring 6 - Coach/accountability surfaces

Goal: support other humans without leaking private data.

Deliver:

- Coach mode in web app first.
- Invitations and scoped grants.
- Assigned actor/person list.
- Comment/nudge/suggestion flows.
- Accountability check-ins.
- Audit visibility for coached user.

Exit criteria:

- A coached user can see who has access and revoke it.
- Coach cannot see private items.
- Coach cannot mutate the user's plan unless a specific action is granted.

### Ring 7 - Advanced AI and ambient intelligence

Goal: useful companion behavior after enough data exists.

Deliver:

- Pattern detection jobs.
- Behavioral insights.
- Suggestion ranking.
- Optional auto-drafting.
- Integration signals from calendar/email/Slack/Linear.
- Notification throttling.

Exit criteria:

- AI is quieter than the user.
- Suggestions are accepted often enough to justify their existence.
- No private integration signal is used without explicit consent.

## Micro Roadmap: Next 12 Implementation Slices

1. Create v2 domain fixture inside the current store.
2. Build selectors from v2 fixture to existing Today rows.
3. Add `FlowSession` fixture and current-focus selector.
4. Render a small current-focus affordance in Today.
5. Convert embedded subtasks to child `Item`s and `ItemRelation(type='contains')`.
6. Add child item creation through relation-aware store actions.
7. Move planning fields from task mock records into `ItemPlan`.
8. Move event time state into `ItemOccurrence`.
9. Add local repository interface, still backed by in-memory fixtures.
10. Add SQLite spike behind the same repository interface.
11. Add migration files and local seed/import/export.
12. Cut a "local daily-flow MVP" build for real use.

## Fast-Fail Learning Loops

Each implementation slice should answer one question.

Examples:

- Does current focus make the day clearer?
- Are transitions useful or annoying?
- Are subtasks better as child items in the UI?
- Does the user need calendar import before local planning?
- Does the user actually reorder flexible tasks during the day?
- Are AI suggestions helpful enough before behavioral history exists?
- Does a coach/accountability partner need a separate app, or just scoped web access?

Keep experiments small:

- One branch.
- One user-facing behavior.
- One verification path.
- One decision log entry.

## Cost Roadmap

### $0 local dev

- Electron app.
- SQLite local DB.
- Export/import backup.
- Local structured logs.
- Mock integrations.
- No cloud sync.

### Nearly free private beta

- Single cheap Postgres provider or local VPS Postgres.
- NestJS server on a cheap/free host.
- Static web app on a free static host.
- Manual backups.
- Minimal analytics, opt-in.
- No managed sync engine unless there is real multi-device pain.

### Low-cost production

- Managed Postgres with backups.
- Server logs/traces.
- Crash/error tracking.
- Email provider for account/invites.
- Push notification credentials.
- Rate limiting.
- Object storage only if attachments arrive.

### Growth

- Managed sync engine if custom sync consumes too much time.
- Queue/worker only when background jobs need it.
- Redis only when rate limits/cache/jobs require it.
- Dedicated analytics only when product questions cannot be answered from local/server events.

## Monorepo Migration Plan

Do this only after Ring 1 or when starting Ring 3.

### Step 0 - Recovery checkpoint

```text
git status --short
npm run typecheck
npm run lint
git commit -m "Checkpoint before monorepo migration"
git switch -c codex/monorepo-migration
```

### Step 1 - Add package without moving app

```text
package.json workspaces:
  "workspaces": ["packages/*"]

packages/domain/
  package.json
  src/index.ts
```

Move only domain types and pure helpers first.

### Step 2 - Prove package imports

- Electron imports `@needle/domain`.
- Typecheck passes.
- App starts.
- No desktop folder move yet.

### Step 3 - Add db/design packages

```text
packages/db-schema
packages/design-tokens
```

No web/mobile/server yet.

### Step 4 - Move desktop

Only after package imports are stable:

```text
apps/desktop
```

Use `git mv`, then update Vite/Electron Forge/TypeScript configs.

### Step 5 - Add server

```text
apps/server
```

NestJS app imports `@needle/domain` and `@needle/db-schema`.

### Step 6 - Add web/mobile

Add one at a time. Web first if sync/API is being tested; mobile first only if capture/notifications are the main validated need.

## Repository Shape When Mature

```text
apps/
  desktop/
    src/main/
    src/preload/
    src/renderer/
  web/
    src/
  mobile/
    app/
    src/
  server/
    src/

packages/
  domain/
    src/types/
    src/commands/
    src/selectors/
    src/validation/
  db-schema/
    src/
    migrations/
  design-tokens/
    src/
  ui-web/
    src/
  ui-native/
    src/
  sync/
    src/
  ai/
    src/
  config/
    eslint/
    tsconfig/
```

## What Not To Do Yet

- Do not rewrite Electron in React Native macOS.
- Do not build mobile before local persistence.
- Do not build a separate coach app before scoped coach access exists.
- Do not adopt a sync vendor before the operation model is clear.
- Do not add Redis, queues, Kubernetes, or event streaming for the MVP.
- Do not put AI suggestions in the same path as user-approved mutations.
- Do not make notifications the main retention loop.
