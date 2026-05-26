# Needle v2 Data Model

This is the target persistence model for local SQLite and server Postgres. It is intentionally written with portable concepts: text IDs, ISO timestamps, workspace scoping, and append-friendly activity logs.

## ID Strategy

Use client-generated text IDs, preferably UUIDv7 or ULID.

Why:

- Works offline.
- Sortable enough for debugging and sync.
- Portable across SQLite/Postgres/web.

## Tables

### users

Human accounts.

```sql
users (
  id text primary key,
  email text,
  display_name text not null,
  avatar_url text,
  created_at text not null,
  updated_at text not null
)
```

### actors

Anything that can act in the system.

```sql
actors (
  id text primary key,
  workspace_id text not null,
  kind text not null, -- user | ai_agent | coach | accountability_partner | integration | system
  user_id text,
  display_name text not null,
  metadata_json text not null default '{}',
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### workspaces

```sql
workspaces (
  id text primary key,
  name text not null,
  kind text not null, -- personal | shared | team
  created_by_actor_id text not null,
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### workspace_memberships

```sql
workspace_memberships (
  workspace_id text not null,
  user_id text not null,
  role text not null, -- owner | admin | member | viewer
  created_at text not null,
  updated_at text not null,
  primary key (workspace_id, user_id)
)
```

### sources

```sql
sources (
  id text primary key,
  workspace_id text not null,
  kind text not null, -- manual | calendar | slack | email | ai | system
  external_account_id text,
  label text not null,
  metadata_json text not null default '{}',
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### items

The central table.

```sql
items (
  id text primary key,
  workspace_id text not null,
  kind text not null, -- task | event | note | memory | habit
  bucket text not null, -- act | remember
  title text not null,
  body text,
  status text not null, -- open | in_progress | done | skipped | cancelled | archived
  visibility text not null default 'workspace', -- private | workspace | shared_link
  source_id text,
  created_by_actor_id text not null,
  updated_by_actor_id text not null,
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### item_relations

Subtasks are stored here as `relation_type = 'contains'`.

```sql
item_relations (
  id text primary key,
  workspace_id text not null,
  from_item_id text not null,
  to_item_id text not null,
  relation_type text not null, -- contains | prep_for | blocks | relates_to | generated_from | mentioned_in | duplicate_of
  sort_order real not null default 0,
  created_by_actor_id text not null,
  created_at text not null,
  archived_at text,
  unique (from_item_id, to_item_id, relation_type)
)
```

### item_assignments

```sql
item_assignments (
  id text primary key,
  workspace_id text not null,
  item_id text not null,
  actor_id text not null,
  role text not null, -- owner | assignee | watcher | coach | accountability_partner
  status text not null default 'open',
  created_by_actor_id text not null,
  created_at text not null,
  updated_at text not null,
  archived_at text,
  unique (item_id, actor_id, role)
)
```

### item_plans

Per-actor planning and Today placement.

```sql
item_plans (
  id text primary key,
  workspace_id text not null,
  item_id text not null,
  actor_id text not null,
  plan_date text, -- YYYY-MM-DD; null means stash/unplanned
  mode text not null, -- anchor | float | stash
  start_time text,
  end_time text,
  slot_index integer,
  slot_order real,
  timezone text not null,
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### item_occurrences

Concrete time blocks, especially calendar events.

```sql
item_occurrences (
  id text primary key,
  workspace_id text not null,
  item_id text not null,
  source_id text,
  external_id text,
  starts_at text not null,
  ends_at text not null,
  timezone text not null,
  recurrence_rule text,
  status text not null default 'confirmed',
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### comments

```sql
comments (
  id text primary key,
  workspace_id text not null,
  item_id text not null,
  actor_id text not null,
  body text not null,
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### flow_sessions

One actor's intentional day.

```sql
flow_sessions (
  id text primary key,
  workspace_id text not null,
  actor_id text not null,
  flow_date text not null, -- YYYY-MM-DD
  state text not null, -- planning | focusing | transitioning | paused | reviewing | done
  active_item_id text,
  created_at text not null,
  updated_at text not null,
  archived_at text,
  unique (workspace_id, actor_id, flow_date)
)
```

### focus_sessions

Actual focus time spent on an item.

```sql
focus_sessions (
  id text primary key,
  workspace_id text not null,
  actor_id text not null,
  item_id text not null,
  flow_session_id text,
  started_at text not null,
  ended_at text,
  outcome text, -- completed | paused | interrupted | abandoned | deferred
  energy_before integer,
  energy_after integer,
  metadata_json text not null default '{}',
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### transition_events

Lightweight records for task-to-task movement.

```sql
transition_events (
  id text primary key,
  workspace_id text not null,
  actor_id text not null,
  flow_session_id text not null,
  from_item_id text,
  to_item_id text,
  kind text not null, -- start_day | close_item | switch_item | reset | break | resume | end_day
  prompt text,
  response text,
  created_at text not null
)
```

### reflections

Short completion/transition notes.

```sql
reflections (
  id text primary key,
  workspace_id text not null,
  actor_id text not null,
  item_id text,
  flow_session_id text,
  focus_session_id text,
  kind text not null, -- completion | transition | end_of_day | overload | freeform
  mood text,
  energy integer,
  body text,
  follow_up_item_id text,
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### suggestions

Optional guidance from AI, coaches, accountability partners, or system logic.

```sql
suggestions (
  id text primary key,
  workspace_id text not null,
  actor_id text not null, -- who/what made the suggestion
  target_actor_id text not null,
  item_id text,
  flow_session_id text,
  kind text not null, -- reorder | reschedule | split | break | reduce_scope | cluster | reflect | nudge
  title text not null,
  rationale text,
  payload_json text not null default '{}',
  status text not null, -- pending | accepted | dismissed | snoozed | expired
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### behavioral_insights

Pattern observations learned over time.

```sql
behavioral_insights (
  id text primary key,
  workspace_id text not null,
  actor_id text not null, -- who/what observed it
  target_actor_id text not null,
  kind text not null, -- energy_pattern | overload_pattern | focus_window | procrastination_pattern | recovery_gap
  title text not null,
  body text not null,
  confidence real,
  evidence_json text not null default '{}',
  status text not null, -- active | dismissed | stale | archived
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### invitations

Pending access paths for workspace, item, coach, or accountability access.

```sql
invitations (
  id text primary key,
  workspace_id text not null,
  item_id text,
  invited_email text,
  invited_user_id text,
  invited_actor_kind text, -- user | coach | accountability_partner
  workspace_role text, -- owner | admin | member | viewer
  assignment_role text, -- assignee | watcher | coach | accountability_partner
  token_hash text not null,
  status text not null, -- pending | accepted | revoked | expired
  invited_by_actor_id text not null,
  accepted_by_user_id text,
  expires_at text,
  accepted_at text,
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### devices

Installed clients or browser profiles used for sync, diagnostics, and notifications.

```sql
devices (
  id text primary key,
  user_id text not null,
  actor_id text,
  platform text not null, -- macos | web | ios | android
  app_version text,
  device_name text,
  push_provider text, -- apns | fcm | expo | web_push | none
  push_token_hash text,
  last_seen_at text,
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### notification_preferences

Per-actor notification settings.

```sql
notification_preferences (
  id text primary key,
  workspace_id text not null,
  actor_id text not null,
  channel text not null, -- in_app | system | push | email
  topic text not null, -- current_focus | transition | task_reminder | calendar | coach | accountability | ai_suggestion | daily_review | sync | system
  enabled integer not null default 1,
  quiet_hours_start text,
  quiet_hours_end text,
  timezone text not null,
  metadata_json text not null default '{}',
  created_at text not null,
  updated_at text not null,
  archived_at text,
  unique (workspace_id, actor_id, channel, topic)
)
```

### notification_events

Queued or delivered notification intents.

```sql
notification_events (
  id text primary key,
  workspace_id text not null,
  actor_id text not null, -- target actor
  source_actor_id text, -- coach, AI, integration, system, or user who caused it
  topic text not null,
  title text not null,
  body text,
  item_id text,
  flow_session_id text,
  suggestion_id text,
  scheduled_for text,
  priority text not null default 'normal', -- low | normal | high
  status text not null, -- queued | sent | delivered | opened | dismissed | failed | cancelled
  metadata_json text not null default '{}',
  created_at text not null,
  updated_at text not null,
  archived_at text
)
```

### notification_deliveries

Append-only delivery attempts for notification events.

```sql
notification_deliveries (
  id text primary key,
  workspace_id text not null,
  notification_event_id text not null,
  device_id text,
  channel text not null, -- in_app | system | push | email
  provider text, -- electron | expo | apns | fcm | web_push | email
  provider_message_id text,
  status text not null, -- queued | sent | delivered | opened | dismissed | failed | cancelled
  error text,
  attempted_at text not null,
  created_at text not null,
  updated_at text not null
)
```

### app_sessions

Coarse app usage sessions. These support product learning without mixing usage data into domain audit.

```sql
app_sessions (
  id text primary key,
  workspace_id text,
  actor_id text,
  device_id text,
  surface text not null, -- desktop | web | mobile | server
  app_version text,
  started_at text not null,
  ended_at text,
  created_at text not null,
  updated_at text not null
)
```

### usage_events

Product telemetry. Do not store task titles, note bodies, reflection bodies, calendar text, or raw prompts here.

```sql
usage_events (
  id text primary key,
  workspace_id text,
  actor_id text,
  app_session_id text,
  event_name text not null,
  properties_json text not null default '{}',
  created_at text not null
)
```

### activity_log

Append-only audit and sync-friendly history.

```sql
activity_log (
  id text primary key,
  workspace_id text not null,
  actor_id text not null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_json text,
  after_json text,
  created_at text not null
)
```

### sync_operations

Optional outbox for local-first desktop.

```sql
sync_operations (
  id text primary key,
  workspace_id text not null,
  actor_id text not null,
  device_id text,
  operation_type text not null,
  entity_type text not null,
  entity_id text not null,
  payload_json text not null,
  local_created_at text not null,
  synced_at text,
  conflict_state text not null default 'none'
)
```

### sync_cursors

Local/server cursors for incremental sync.

```sql
sync_cursors (
  id text primary key,
  workspace_id text not null,
  actor_id text not null,
  device_id text not null,
  direction text not null, -- push | pull
  cursor text not null,
  last_synced_at text,
  created_at text not null,
  updated_at text not null,
  unique (workspace_id, actor_id, device_id, direction)
)
```

## Indexes

Minimum indexes:

```sql
create index idx_items_workspace_updated on items (workspace_id, updated_at);
create index idx_item_relations_from on item_relations (workspace_id, from_item_id, relation_type, sort_order);
create index idx_item_relations_to on item_relations (workspace_id, to_item_id, relation_type);
create index idx_item_assignments_actor on item_assignments (workspace_id, actor_id, status);
create index idx_item_plans_actor_date on item_plans (workspace_id, actor_id, plan_date, mode, slot_index, slot_order);
create index idx_item_occurrences_time on item_occurrences (workspace_id, starts_at, ends_at);
create index idx_flow_sessions_actor_date on flow_sessions (workspace_id, actor_id, flow_date);
create index idx_focus_sessions_actor_time on focus_sessions (workspace_id, actor_id, started_at);
create index idx_suggestions_target_status on suggestions (workspace_id, target_actor_id, status, created_at);
create index idx_behavioral_insights_target on behavioral_insights (workspace_id, target_actor_id, status, kind);
create index idx_invitations_workspace_status on invitations (workspace_id, status, expires_at);
create index idx_devices_user_seen on devices (user_id, last_seen_at);
create index idx_notification_preferences_actor on notification_preferences (workspace_id, actor_id, channel, topic);
create index idx_notification_events_actor_status on notification_events (workspace_id, actor_id, status, scheduled_for);
create index idx_notification_deliveries_event on notification_deliveries (workspace_id, notification_event_id, attempted_at);
create index idx_app_sessions_actor_time on app_sessions (workspace_id, actor_id, started_at);
create index idx_usage_events_name_time on usage_events (event_name, created_at);
create index idx_activity_log_workspace_time on activity_log (workspace_id, created_at);
create index idx_sync_operations_pending on sync_operations (workspace_id, synced_at, local_created_at);
create index idx_sync_cursors_device on sync_cursors (workspace_id, actor_id, device_id, direction);
```

## Query Examples

### Today for one actor

1. Find `item_plans` for actor/date.
2. Join `items`.
3. Join child counts from `item_relations where relation_type = 'contains'`.
4. Join event occurrences overlapping the date.

### Subtasks for a task

1. Query `item_relations` where `from_item_id = parent` and `relation_type = 'contains'`.
2. Sort by `sort_order`.
3. Join `items` for child rows.

### Shared task dashboard

1. Query `item_assignments` by actor/workspace.
2. Join `items`.
3. Join plans for the current actor only.

## Migration Rule

Never persist UI-only fields:

- `dateLabel`
- `datePill`
- `kind` as priority color
- `timeSlot`
- `isOverdue`

These belong in selectors/view models.
