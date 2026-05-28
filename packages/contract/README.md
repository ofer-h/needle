# @needle/contract

The API/IPC contract — the request/response shapes exchanged across the app's
data boundary. Today it defines the Electron IPC payloads (`window.api`); it is
the direct ancestor of the future HTTP contract (ts-rest) that the web/mobile
clients and the NestJS server will share. See
[`../../docs/v2/monorepo-migration-plan.md`](../../docs/v2/monorepo-migration-plan.md).

## Usage

```ts
import { ... } from '@needle/contract';
```

Depends on `@needle/domain` (`/types`, `/flow-health`) for the underlying entity
types. Source-only (no build step); typechecked via `tsc`.

## Scripts

- `typecheck` — `tsc --noEmit`.

## Evolution

When the backend is built, this package grows into a ts-rest contract (Zod I/O)
that the NestJS server implements and a typed `@needle/api-client` consumes — same
shapes, transported over HTTP instead of IPC.
