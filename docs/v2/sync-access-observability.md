# Sync, Access, Notifications, And Observability

This document defines how Needle should grow from a local macOS app into a synced multi-user product without losing the calm daily-flow experience.

## Layers Of Truth

Needle needs separate event streams for separate jobs.

| Stream | Purpose | User visible? | Sync critical? |
|---|---|---:|---:|
| Domain tables | Current truth for items, plans, flow, actors, suggestions | yes | yes |
| `activity_log` | Audit trail for who changed what | partially | yes |
| `sync_operations` | Local outbox of pending client writes | no | yes |
| `usage_events` | Product learning and funnel metrics | no/opt-in | no |
| App logs/errors | Debugging and reliability | no | no |

Do not mix product analytics into `activity_log`. A user completing a task is domain history; a user opening the app three times is usage telemetry.

## Sync Strategy

### Phase 0 - Local-only

Goal: make the macOS app useful without any account or network dependency.

- SQLite database in `app.getPath('userData')`.
- Migrations stored in repo.
- Repository API in main process.
- Renderer uses typed IPC only.
- Every write is converted into a domain command.
- Every command writes domain state plus `activity_log`.
- `sync_operations` can exist locally even before a server.

### Phase 1 - Manual backup/export

Goal: zero cloud cost and recoverability.

- Export workspace as a signed/enveloped JSON file.
- Import into a new local database.
- Optional local encrypted backup folder.
- No silent iCloud/Dropbox coupling in MVP.

### Phase 2 - Single-user cloud sync

Goal: one user can use desktop and web/mobile against the same data.

Server:

- NestJS modular monolith.
- Postgres.
- Auth.
- Permission guard.
- Operation endpoint.
- Changes endpoint.

Client:

- Local SQLite remains source for responsive UI.
- Outbox uploads operations.
- Pull cursor downloads changes.
- UI shows sync health, but does not block daily planning unless a write is impossible.

Minimal API:

```text
POST /workspaces/:workspaceId/operations
GET  /workspaces/:workspaceId/changes?cursor=:cursor
GET  /workspaces/:workspaceId/today?actorId=:actorId&date=:date
GET  /workspaces/:workspaceId/flow?actorId=:actorId&date=:date
```

### Phase 3 - Multi-user collaboration

Goal: shared items, coaches, and accountability partners.

- Every operation is attributed to an actor.
- Server validates every operation against workspace membership, item visibility, assignments, invitations, and explicit grants.
- Comments, reflections, focus sessions, transition events, suggestions, and activity log are append-friendly.
- Plans and flow sessions remain actor/date scoped so users can share tasks without sharing a whole day plan.

### Phase 4 - Managed sync evaluation

Only evaluate a managed/local-first sync engine after the manual operation protocol is proven.

Candidates to re-check:

- PowerSync: strong Postgres-to-SQLite fit, React Native/Expo and web SDKs.
- ElectricSQL: shape-based Postgres sync.
- Jazz: local-first relational DB with row-level permissions.
- WatermelonDB: React/React Native local DB with backend sync protocol.
- Zero/Replicache lineage: instant web sync patterns, but check current maintenance and mobile fit.

Evaluation criteria:

- Works with Electron, Expo, and web.
- Does not force a product-model rewrite.
- Supports workspace-scoped partial replication.
- Lets server-side authorization remain enforceable.
- Has a clear self-host/free path or cheap starter plan.
- Does not make AI/coach writes opaque.

## Conflict Rules

Start boring.

| Entity | Rule |
|---|---|
| Items | Last-write-wins by field, preserve `activity_log` |
| Item body/notes | Last-write-wins now; CRDT later only if collaborative editing matters |
| Item relations | Unique relation key; archive means remove |
| Assignments | Unique item/actor/role; status is actor scoped |
| Plans | Actor scoped, so most conflicts are self-conflicts |
| Occurrences | External calendar source wins for imported events unless user creates local override |
| Comments | Append-only |
| Reflections | Append-first; edits are rare and audited |
| Suggestions | Status is last-write-wins; accepted operations are user-attributed |
| Behavioral insights | Low-frequency records; stale/dismissed/archived status wins |
| Notifications | Delivery is append-only; preferences are last-write-wins |
| Usage events | Append-only and non-critical |

## Access Model

### Concepts

- `User`: authenticated human account.
- `Actor`: anything that can act: user, AI, coach, partner, integration, system.
- `WorkspaceMembership`: coarse workspace access.
- `ItemAssignment`: item-level relationship and role.
- `Invitation`: pending access path for a user, coach, or partner.
- `ActivityLog`: proof of who did what.

### Permission Shape

Use a simple ability function before adopting heavy policy infrastructure:

```ts
can(actor, action, subject, context): boolean
```

Actions:

- `workspace:manage`
- `workspace:invite`
- `item:create`
- `item:read`
- `item:update`
- `item:archive`
- `item:assign`
- `item:comment`
- `plan:update_self`
- `flow:update_self`
- `suggestion:create`
- `suggestion:accept_self`
- `notification:manage_self`
- `telemetry:export_self`

Subjects:

- workspace
- item
- item relation
- assignment
- plan
- occurrence
- flow session
- focus session
- transition event
- reflection
- suggestion
- behavioral insight
- notification preference
- usage export

### Initial Rules

Workspace:

- Owner/admin can invite, remove, and change membership.
- Member can create personal/shared items depending on workspace policy.
- Viewer can read allowed workspace items, not mutate.

Item:

- Owner/assignee can edit item content.
- Assignee can update their own assignment status.
- Watcher can read/comment if item visibility allows.
- Coach/accountability partner can read/comment/nudge only for assigned or explicitly granted scope.
- AI can create suggestions, insights, and generated child items as drafts/suggestions.

Planning:

- Each actor controls their own `ItemPlan`.
- No coach or AI silently reorders another actor's day.
- Accepting a reorder suggestion creates a user-attributed plan update.

Flow:

- Each actor controls their own `FlowSession`.
- Coaches can view/comment only if granted.
- AI can observe and suggest, but the user owns transitions and completion.

### Access Checks

Client:

- Hide unavailable controls.
- Explain why coach/partner/AI actions are limited.

Server:

- Validate authentication.
- Load actor and workspace membership.
- Check ability for every operation.
- Re-check row ownership and workspace scope in every repository method.
- Reject cross-workspace IDs even if guessed.

Database:

- All workspace-scoped tables include `workspace_id`.
- Add indexes for `(workspace_id, id)` and high-volume lookup fields.
- If using Supabase/direct client access later, enable Postgres RLS for exposed tables.
- Service keys and privileged database roles never ship to clients.

## Coach And Accountability Access

Start with one "coach view" inside the main app before building a separate coach app.

Minimum coach surface:

- List assigned people/workspaces.
- Today snapshot for granted actor.
- Comment/nudge on items.
- Suggest break, scope reduction, or follow-up.
- See agreed accountability check-ins.
- Cannot see private items unless explicitly shared.

Future dedicated coach app:

- Use same web app package.
- Feature flag coach navigation.
- Same API and permission checks.
- Separate dashboards only after coach workflows prove real.

## Notifications Model

### Channels

- `in_app`: visible in Needle.
- `system`: local macOS/iOS/Android notification.
- `push`: server-triggered remote notification.
- `email`: account/collaboration essentials only.

### Topics

- Current focus.
- Transition.
- Scheduled task reminder.
- Calendar/event reminder.
- Coach/accountability nudge.
- AI suggestion.
- Daily review.
- Sync/account/security.

### Product Rules

- Default to in-app before system notifications.
- User chooses topics and quiet hours.
- No streak/shame notifications.
- No repeated nagging for ignored suggestions.
- A notification should point to a useful action, not just a demand.
- Notifications that come from a coach or AI actor are clearly attributed.

### Platform Rules

Desktop:

- Use Electron main-process notification support or renderer Web Notifications through the approved IPC boundary.
- macOS production notifications require signing/notarization considerations.

Mobile:

- Use Expo notifications for local and push notifications when the Expo app exists.
- Push requires a development build and credentials; do not rely on Expo Go for production behavior.

Web:

- Use Web Push only after login, explicit permission, and service worker readiness.

## Observability And Metrics

### Product Metrics

Track the smallest set that teaches whether the daily-flow product works:

- `app_opened`
- `task_captured`
- `task_planned_today`
- `task_reordered`
- `focus_started`
- `focus_completed`
- `transition_started`
- `reflection_saved`
- `suggestion_shown`
- `suggestion_accepted`
- `suggestion_dismissed`
- `coach_comment_added`
- `notification_sent`
- `notification_opened`

Derived metrics:

- Daily active usage.
- Tasks reorganized during day.
- Reduced rollover.
- Focus session completion.
- Suggestion acceptance/dismissal.
- Return after transition.
- Subjective clarity/control rating.

### Reliability Metrics

- App start time.
- Renderer crash count.
- Main-process error count.
- IPC failure count.
- Database migration failure.
- Sync queue depth.
- Sync last success age.
- Conflict count.
- Notification delivery failures.

### Privacy Rules

- Product analytics is opt-in once cloud exists.
- Do not send task titles, notes, reflection bodies, or calendar text to analytics.
- Use stable internal IDs only where needed, and hash/anonymize for analytics.
- Keep raw app logs local by default.
- AI analysis of sensitive content must be explicit and scoped.

### Tooling Path

Local-only:

- Structured local log files.
- `usage_events` table.
- Export diagnostic bundle by explicit user action.

Cheap hosted:

- OpenTelemetry-compatible traces/metrics from server.
- Umami for lightweight web analytics if needed.
- PostHog Cloud/free or self-host later only if product funnels/feature flags justify it.
- Sentry or an open-source equivalent later for crash/error telemetry when the app has testers.

## Stop Conditions

Stop and re-plan if:

- A proposed sync tool requires abandoning `Item`, `Actor`, `ItemPlan`, or `FlowSession`.
- Coach access cannot be explained with a visible grant.
- AI can mutate user work without an accepted suggestion.
- Notifications become the primary engagement mechanism.
- Product analytics requires collecting sensitive task/reflection text.
- A folder migration mixes Electron main, preload, renderer, server, or mobile boundaries.
