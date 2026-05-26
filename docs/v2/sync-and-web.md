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
```

For web, API handlers can use the same domain types from `src/shared/domain-v2.ts` or a future extracted package.

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
