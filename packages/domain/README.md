# @needle/domain

The shared domain model: types, validation, and business rules. This is the spine
that keeps every surface (desktop today; web/server/mobile later) speaking the
same language, so the eventual sync between local SQLite and the backend Postgres
is an adapter, not a rewrite. See
[`../../docs/v2/monorepo-migration-plan.md`](../../docs/v2/monorepo-migration-plan.md).

## Exports (subpaths)

```ts
import type { ... } from '@needle/domain/types';        // view/task/event types
import type { ... } from '@needle/domain/domain-v2';     // v2 domain model (Item, Plan, ...)
import type { ... } from '@needle/domain/flow-health';   // flow-health helpers
```

Subpath exports (no barrel) are used to avoid name collisions between `types` and
`domain-v2`. Source is consumed directly as TypeScript by bundlers/tsc — there is
no build step.

## Scripts

- `typecheck` — `tsc --noEmit`.

## Rules

- Keep it **platform-agnostic**: no Electron, DOM-only, Node-only, or React code.
  It must be importable by the Electron main process, a React renderer, a NestJS
  server, and React Native.
