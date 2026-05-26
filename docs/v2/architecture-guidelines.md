# V2 Architecture Guidelines

This document turns the daily-flow PRD into engineering guardrails. It should be read before large changes to app structure, persistence, sync, backend, web, mobile, notifications, analytics, AI, or coach/accountability access.

## North Star

Needle is a calm AI-assisted daily operating system for intentional work and life flow.

The architecture must optimize for:

- Fast solo iteration by one developer.
- A strong macOS MVP before platform sprawl.
- TypeScript-first sharing across desktop, web, server, and mobile.
- Local-first behavior where the app still works when the network is absent.
- A clean path from local-only to cheap hosted services to larger infrastructure.
- Multi-user, coach, accountability, and AI actors without rewriting the domain.
- User trust: every important write is attributed, reversible, and auditable.

## Product Architecture Rules

### 1. The running app comes before the platform dream

Do not start with a big monorepo migration, mobile rewrite, or managed sync service. First make the macOS app useful:

1. Today timeline.
2. Current focus state.
3. First-class subtasks as child items.
4. Local persistence.
5. Lightweight transitions/reflections.
6. Optional suggestions.

Web, mobile, server, sync, and coach portals should be designed now, but extracted only when the current app has stable domain seams.

### 2. Domain is shared, UI is platform-specific

Share:

- Domain types.
- Database table names and schema decisions.
- Validation schemas.
- Selectors that produce Today, Flow, and Item views.
- Sync operation shapes.
- Design tokens.
- Copy/tone guidelines.

Do not force-share:

- React DOM components into React Native.
- Electron IPC code into web/mobile.
- Native notification code across platforms.
- Server-only authorization guards into clients.

### 3. Mac first, but not Mac-only

Keep Electron for the macOS MVP because the app already exists and the repo rules are built around secure Electron boundaries.

If the product later needs a truly native desktop rewrite, evaluate it after the product has traction. Until then, native feel comes from:

- A secure Electron shell.
- Local SQLite.
- macOS-specific notifications, menus, keyboard shortcuts, and window polish.
- UI discipline from `design/` and `.cursor/rules/design-*.mdc`.

### 4. React Native/Expo is the preferred mobile path

For mobile, prefer Expo/React Native over Flutter or separate native apps.

Reasoning:

- The product and backend are TypeScript-first.
- Domain, selectors, validation, AI prompts, and tokens can be shared.
- Expo supports iOS, Android, web previews, local notifications, and push notifications.
- Flutter is strong, but it would split the product into TypeScript plus Dart.
- Fully native Swift/Kotlin should be reserved for isolated capabilities, not the first mobile app.

### 5. Backend is a modular monolith first

When cloud sync begins, prefer a NestJS modular monolith:

- `AuthModule`
- `WorkspaceModule`
- `ItemsModule`
- `PlanningModule`
- `FlowModule`
- `SyncModule`
- `NotificationsModule`
- `SuggestionsModule`
- `IntegrationsModule`
- `TelemetryModule`

Avoid microservices until there are real scaling boundaries. A modular monolith keeps deployment cheap and debugging humane.

### 6. Sync is explicit, not magical

The baseline sync model is:

1. Client writes to local SQLite.
2. Client appends `activity_log`.
3. Client appends `sync_operations` outbox.
4. UI updates immediately.
5. Background sync pushes operations to the server.
6. Server validates permissions and applies operations to Postgres.
7. Client pulls changes by cursor.

Managed sync engines are possible later, but the app should first own its domain operations and conflict rules.

### 7. Access control is server-side truth

Clients may hide UI affordances, but server and database checks decide truth.

The model should combine:

- RBAC for coarse workspace roles.
- Relationship/attribute checks for items, assignments, coaches, accountability partners, and AI actors.
- Deny-by-default policies.
- Auditable grants and revocations.

### 8. AI and coaches are actors, not hidden privileges

AI agents, coaches, accountability partners, integrations, and users are all `Actor`s.

Rules:

- AI suggestions are optional records, not silent mutations.
- Accepting a suggestion creates a user-attributed operation.
- Coaches/accountability partners can comment, nudge, and observe within granted scope.
- Coaches cannot silently complete or rewrite a user's work unless explicitly granted.
- All external actors must be scoped to a workspace, item, flow session, or assignment.

### 9. Notifications are a product surface, not just plumbing

Notifications must support the product tone:

- Calm.
- Sparse.
- Contextual.
- Quiet-hours aware.
- User-configurable.

Default order:

1. In-app awareness.
2. Local/system notifications for committed reminders.
3. Push notifications only after login/cloud/device identity exists.
4. Email only for account and collaboration essentials.

### 10. Observability starts local and privacy-first

Needle needs three event streams:

- `activity_log`: domain audit trail and sync history.
- `usage_events`: product behavior and funnel learning.
- `app_logs` or error telemetry: reliability debugging.

At first, keep usage metrics local and exportable. Later, send opt-in anonymized events to a cheap/self-hostable analytics service.

## Stack Direction

### Current

```text
Electron + React + Vite + Zustand
src/main       Electron main
src/preload    IPC bridge
src/renderer   React UI
src/shared     pure TypeScript contracts
```

### Near-term target

```text
Electron app
  local SQLite
  repository layer
  v2 domain selectors
  outbox-ready operations
```

### Multi-app target

```text
apps/
  desktop/      Electron macOS app
  web/          React web app, likely Vite app first
  mobile/       Expo app
  server/       NestJS modular monolith

packages/
  domain/       types, validation, commands, selectors
  db-schema/    Drizzle/Kysely schema and SQL migrations
  design-tokens/
  ui-web/
  ui-native/
  sync/
  ai/
  config/
```

## Monorepo Policy

Do not move to a monorepo today just because it is the eventual shape.

Move when at least one of these is true:

- The server app exists.
- The web app exists.
- The mobile app exists.
- A shared package is imported by two real apps.
- Build/test scripts are painful enough that workspace task caching pays for itself.

Recommended first monorepo step:

1. Keep `npm` unless there is a separate package-manager decision.
2. Add npm workspaces.
3. Add `packages/domain` first.
4. Move `src/shared/domain-v2.ts` into `packages/domain/src`.
5. Update the Electron app to import from the package.
6. Add `apps/desktop` only after the shared package works.
7. Add Turborepo when there are multiple packages with repeated `lint`, `typecheck`, `test`, and `build` tasks.

## Repository Migration Recovery Rules

Before any folder move:

1. Ensure `git status --short` is clean or intentionally staged.
2. Commit a checkpoint.
3. Create a branch for the migration.
4. Use `git mv` for tracked files.
5. Move one execution context at a time.
6. Run `npm run typecheck`, `npm run lint`, and the relevant app start/build command after each move.
7. If the move goes sideways, revert the migration commit or branch, not user work.

Do not bulk move `src/` into `apps/desktop/` until the package extraction proves imports, Vite, Electron Forge, and TypeScript configs still work.

## Source-Informed Notes

- Turborepo's internal packages pattern supports app/package separation and workspace dependencies, but it also documents tradeoffs between just-in-time and compiled packages.
- NestJS supports standard and monorepo modes; its docs explicitly allow delaying the choice until the benefits are clear.
- Electron's security checklist matches the repo's existing security rules: keep context isolation, sandboxing, CSP, IPC validation, and navigation limits.
- PowerSync, WatermelonDB, Jazz, and similar tools validate the local-first direction, but each changes the sync ownership model. Do not choose one before the domain operations are stable.
- OWASP authorization guidance supports deny-by-default, least privilege, every-request validation, and relationship/attribute-based checks for this product shape.
