# Architecture Research Notes

Date: 2026-05-26

Purpose: capture external architecture inputs used for Needle v2 planning. These notes should be refreshed before committing to a sync vendor, auth provider, mobile stack, or monorepo tool.

## Sources Checked

- Turborepo internal packages: https://turborepo.dev/docs/core-concepts/internal-packages
- NestJS workspaces/monorepo mode: https://docs.nestjs.com/cli/workspaces
- NestJS authorization/CASL examples: https://docs.nestjs.com/security/authorization
- OWASP authorization cheat sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- Electron security checklist: https://www.electronjs.org/docs/latest/tutorial/security/
- Electron Notification API: https://www.electronjs.org/docs/latest/api/notification
- Expo notifications: https://docs.expo.dev/push-notifications/what-you-need-to-know/
- PowerSync overview: https://docs.powersync.com/
- WatermelonDB sync intro: https://watermelondb.dev/docs/Sync/Intro
- Jazz overview: https://jazz.tools/docs
- Drizzle migrations: https://orm.drizzle.team/docs/migrations
- OpenTelemetry JavaScript: https://opentelemetry.io/docs/languages/js/
- Umami docs: https://docs.umami.is/docs
- Better Auth introduction: https://better-auth.com/docs/introduction
- Supabase RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security

## Conclusions

### Repo structure

The repo should become a monorepo eventually, but not before it pays for itself.

Turborepo's package model is a good fit for a future `apps/` plus `packages/` structure. NestJS also supports delaying the monorepo choice. For Needle, this means:

- Start with the current single app.
- Extract `packages/domain` before moving the app folder.
- Add monorepo/task tooling when server/web/mobile actually exist.

### Backend

NestJS remains the preferred backend direction.

Use it as a modular monolith first. Avoid microservices, queues, Redis, and extra infrastructure until a concrete feature requires them.

### Data layer

The product should stay SQL-shaped:

- SQLite locally.
- Postgres on the server.
- Typed migrations.

Drizzle and Kysely should be evaluated before Prisma because they keep SQL visible and can support SQLite/Postgres with less abstraction. Prisma remains a fallback if developer speed wins in the persistence spike.

### Sync

Best-practice local-first tools validate the outbox/local-replica direction.

However, adopting PowerSync, Electric, Jazz, WatermelonDB, or Zero too early would make the tool shape the product. Needle should first prove:

- Domain commands.
- Outbox operations.
- Change cursors.
- Conflict policy.
- Access checks.

Then a sync vendor can be evaluated against the proven model.

### Access control

Needle needs RBAC plus relationship/attribute checks:

- Workspace roles for broad access.
- Item assignments and invitations for relationships.
- Actor kind, visibility, and ownership as attributes.
- Server-side checks on every operation.
- Deny-by-default.

CASL is a good candidate for the first TypeScript policy layer because NestJS documents it and it supports incremental RBAC-to-ABAC growth.

### Mobile/native

Expo/React Native is the best first mobile path because Needle wants TypeScript reuse.

Do not chase full UI component sharing. Share domain, selectors, validation, tokens, and behavior. Build native components separately.

### Notifications

Notifications should be a controlled product surface:

- In-app first.
- Local/system notifications second.
- Push after account/device registration.
- Quiet hours and topic preferences from day one of notifications.

Electron and Expo each have platform-specific notification behavior, so notification domain state should be shared while delivery adapters remain platform-specific.

### Observability

OpenTelemetry is the right long-term standard for server traces/metrics/logs, but local MVP should start with:

- Structured local logs.
- `usage_events` table.
- Explicit diagnostic export.

Analytics tools such as Umami/PostHog/Sentry-style error tracking should be added only after beta usage creates real questions.

## Decisions To Revisit

- Drizzle vs Kysely vs Prisma after the SQLite persistence spike.
- Better Auth vs Supabase Auth vs Auth.js when NestJS server starts.
- Custom sync vs PowerSync/Electric/Jazz after one-client cloud sync works.
- Vite web app vs Next.js when web begins.
- Expo mobile scope after the Mac local MVP is used for real days.
