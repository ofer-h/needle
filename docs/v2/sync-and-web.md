# Sync And Web Architecture

Needle should support Electron desktop first and web later without forking the product model.

## Target Shape

```text
shared domain contract
  src/shared/domain-v2.ts

desktop app
  local SQLite
  sync outbox
  optional background sync

web app
  same domain types
  server API
  Postgres

server
  auth
  permissions
  sync cursors
  conflict handling
```

For the broader multi-app plan, see `architecture-guidelines.md`, `sync-access-observability.md`, and `multi-app-roadmap.md`.

## Platform Direction

Needle should stay macOS-first while keeping the product model portable.

Recommended sequence:

1. Electron macOS app proves the daily-flow loop.
2. Local SQLite persistence lands behind a repository API.
3. Pure domain code is extracted to a package.
4. NestJS server and Postgres are added for account/sync.
5. Web app reuses the domain package and server API.
6. Expo mobile app reuses domain, selectors, and tokens, but uses native components.

Do not migrate to a monorepo until a second app/server/package exists.

## Local-First Desktop

Desktop should keep working offline.

Local writes:

1. Write canonical table row locally.
2. Append `activity_log`.
3. Append `sync_operations` outbox row.
4. UI updates optimistically.

Sync:

1. Push pending operations.
2. Pull server changes after last cursor.
3. Resolve conflicts per entity type.
4. Update local cursor.

## Web

Web does not need local SQLite first. It can read/write server state directly using the same domain contracts.

Web constraints:

- Same item/actor/relation model.
- Same permissions model.
- Same derived Today view selectors.
- No Electron-only assumptions in shared code.

## Conflict Strategy

Start simple:

- Items: last-write-wins by field with activity log preserved.
- Comments: append-only.
- Activity log: append-only.
- Relations: unique constraint prevents duplicates; archived rows represent removal.
- Plans: actor-scoped, so two users planning the same item do not conflict.
- Assignments: unique `(item_id, actor_id, role)`.
- Flow sessions: actor/date scoped, so each user has their own daily flow.
- Focus sessions, transition events, reflections: append-first; edits are rare and auditable.
- Suggestions and insights: status changes are last-write-wins, content is actor-attributed.

Later:

- CRDT text for long notes if collaborative editing becomes real.
- Merge UI for high-value item conflicts.

## Permissions

Permission checks should happen server-side and in local UI affordances.

Initial rules:

- Workspace owner/admin can manage membership.
- Item creator/owner can edit item content.
- Assignees can update their assignment status.
- Coaches/accountability partners can comment and nudge, not silently complete user work.
- AI actor actions must be visible and reversible.
- AI suggestions must be optional; accepting a suggestion creates a user-attributed operation.

## Actors And Trust

Every write has `actorId`.

Examples:

- Ofer creates a task.
- Calendar integration creates an event occurrence.
- AI coach suggests a child task.
- Accountability partner comments on progress.

The UI can then answer: who did this, where did it come from, and can I undo it?

## API Direction

Keep the first API boring:

```text
GET /workspaces/:id/changes?since=cursor
POST /workspaces/:id/operations
GET /workspaces/:id/today?actorId=&date=
GET /workspaces/:id/flow?actorId=&date=
GET /items/:id
POST /items
PATCH /items/:id
POST /item-relations
POST /focus-sessions
POST /transition-events
POST /reflections
POST /suggestions/:id/accept
POST /suggestions/:id/dismiss
POST /comments
POST /notification-events
PATCH /notification-preferences/:id
```

For web, API handlers can use the same domain types from `src/shared/domain-v2.ts` or a future extracted package.

## Backend Direction

Prefer NestJS as a modular monolith when cloud starts.

Initial modules:

- Auth
- Workspaces
- Items
- Planning
- Flow
- Sync
- Notifications
- Suggestions
- Integrations
- Telemetry

Persistence:

- SQLite locally.
- Postgres on the server.
- Drizzle or Kysely should be evaluated first because they keep SQL visible and TypeScript-friendly across SQLite/Postgres.
- Prisma remains a viable fallback if migration/tooling speed beats local/server portability in practice.

Auth and authorization:

- Local-only MVP needs no account.
- Cloud phase needs user accounts, sessions, workspace memberships, invitations, and server-side policy checks.
- Better Auth, Supabase Auth, or Auth.js can be evaluated when server work starts; choose the one that keeps NestJS integration, passkeys/magic links, and migration away from the provider simple.

## Package Direction

If/when web starts, split:

```text
packages/domain
packages/ui
apps/desktop
apps/web
apps/server
```

Do not do this before it pays for itself. For now, `src/shared/domain-v2.ts` is enough.
