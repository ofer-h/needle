# Needle v2 Domain Model

## Principles

Needle should model work, memory, time, and support relationships in a way that survives desktop, web, sharing, and AI.

Core principles:

- Items are the center of the product.
- Subtasks are child items, not embedded checklist rows.
- Scheduling is separate from item identity.
- Daily flow is a first-class experience, not just a list of items.
- Transitions and reflections are first-class product moments.
- AI suggestions are optional, visible, reversible, and actor-attributed.
- Collaboration is actor-based, not only user-based.
- View labels are derived, not persisted as truth.
- Every important change can be attributed and audited.

## Concepts

### Workspace

A workspace scopes data. Early Needle may have one personal workspace, but the model must support shared workspaces later.

Examples:

- Ofer personal workspace.
- Team workspace.
- Shared accountability group.

### User

A user is a human login account.

Users authenticate, own memberships, and may control one or more actors.

### Actor

An actor is anything that can participate in the system:

- Human user.
- AI coach.
- Accountability partner.
- Calendar sync integration.
- Slack/email integration.
- System automation.

This keeps history honest. "AI created this prep task" and "Maya commented on this" both become actor-attributed events.

### Item

An item is the durable unit of product state.

Item kinds:

- `task` - actionable work.
- `event` - time block, usually calendar-backed.
- `note` - remembered information.
- `memory` - stored reference or fact.
- `habit` - recurring behavioral item, future.

Buckets:

- `act` - needs doing.
- `remember` - stored for retrieval.

Status:

- `open`
- `in_progress`
- `done`
- `skipped`
- `cancelled`
- `archived`

Events do not need checkboxes. Their visible state is derived from occurrence time: upcoming, in progress, or past.

Commitment level (`soft` | `firm` | `unmissable`) signals how aggressively the system should intervene to keep the user on this item. It is set by the user (manually or through accepted suggestions) and read by the planning service when materializing interventions. Most items default to `firm`. `unmissable` is reserved for things the user truly does not want to miss (a critical meeting, a deadline) and unlocks higher-intensity intervention strategies.

### Item Relation

Relations connect items.

Important relation types:

- `contains` - parent task contains child task. This is how subtasks work.
- `prep_for` - task prepares for an event.
- `blocks` - one item blocks another.
- `relates_to` - loose semantic link.
- `generated_from` - AI/generated item from capture/calendar/email.
- `mentioned_in` - item referenced in another item.
- `duplicate_of` - merge/dedupe relation.

Relations can carry `sortOrder` for ordered child tasks.

### Assignment

Assignments connect actors to items.

Roles:

- `owner`
- `assignee`
- `watcher`
- `coach`
- `accountability_partner`

Assignments can carry per-actor status. This lets a shared task be done by one person but still open for another.

### Plan

A plan is a per-actor placement of an item onto a day/timeline.

This replaces the current idea of `Task.date` as canonical truth.

Examples:

- Ofer plans "Review PR" for Tuesday.
- Omri plans the same shared item for Wednesday.
- A task floats between meetings in Ofer's Today view.

Plan fields include:

- `actorId`
- `date`
- `mode`: `anchor`, `float`, or `stash`
- `startTime` / `endTime` for anchored tasks
- `slotIndex` / `slotOrder` for floats
- `timezone`
- `relativeTo`: optional `{ occurrenceId, offsetMinutes }` for plans that anchor relative to another occurrence (for example, "5 minutes before this meeting"). When set, effective wall-clock time is derived from the linked occurrence; if the occurrence moves or cancels, the planner cascades the change rather than freezing stale absolute times.

### Occurrence

An occurrence is a concrete time block. Calendar events use occurrences.

Occurrences support:

- start/end timestamps
- recurrence
- external calendar IDs
- cancellation

### Flow Session

A flow session represents one actor's intentional day.

It answers:

- What day is this?
- Who is flowing through it?
- What is currently active?
- Is the actor focused, transitioning, paused, reviewing, or done?

Flow sessions let the product model "what should I focus on right now?" without burying that state inside UI components.

### Focus Session

A focus session records actual time spent with an item active.

It can start from:

- User manually starting a task.
- User resuming after a transition.
- AI suggestion accepted by the user.

It can end with:

- Completed.
- Paused.
- Interrupted.
- Abandoned.

Focus sessions support future insights such as "deep work tends to go better before 2 PM" without turning completion into a guilt mechanic.

### Transition Event

A transition event records the space between two tasks/events.

Examples:

- Close previous task.
- Reset after meeting.
- Start next task.
- Take recovery break.

Transition events are intentionally lightweight. They are not heavy journaling.

### Reflection

A reflection is a short structured note captured at completion or transition time.

Examples:

- Done.
- Needs follow-up.
- Revisit later.
- Energy was low.
- This was harder than expected.

Reflections feed future guidance and accountability without requiring users to maintain a journal.

### Suggestion

Suggestions are AI or human recommendations that the user can accept, dismiss, or snooze.

Examples:

- Move task after meeting.
- Reduce overload.
- Cluster similar tasks.
- Insert break.
- Split task into child items.

Suggestions are not silent automation. They are visible, optional, and actor-attributed.

### Behavioral Insight

A behavioral insight is an observed pattern surfaced by AI or a coach.

Examples:

- You usually avoid deep work after 4 PM.
- Tuesdays are overloaded.
- You have not had recovery time today.

Insights should be gentle and useful. They should never become shame mechanics.

### Ritual

A ritual is a standing rule that produces prep items and/or interventions in response to a trigger. Rituals turn personal patterns ("always brain-dump 5 minutes before a 1:1") into reusable structure.

Triggers:

- `before_occurrence` / `after_occurrence` - relative to a matching occurrence (filterable by item kind, title contains, source, minimum commitment level).
- `before_focus_start` - when an actor begins a focus session.
- `on_transition` - when a flow session moves between states.
- `time_of_day` - at a local clock time.

Actions are an ordered list. Each action is either:

- `generate_prep_item` - create a child task linked by `prep_for` relation.
- `fire_intervention` - schedule an intervention with a chosen strategy/surface/intensity.
- `open_capture` - surface the brain-dump UI for the user to capture thoughts.

Rituals can be authored by the user directly or proposed by AI through a `Suggestion(kind = 'intervention_strategy')` that the user accepts. Either way, every materialized ritual carries `createdByActorId`.

### Intervention

An intervention is a single attention moment - the unit that drives every product nudge, from an ambient pill to a full screen-takeover effect to a phone push.

Strategies:

- `ambient_pill` - quiet visual hint inside Today.
- `banner` - in-app banner.
- `modal_capture` - opens the brain-dump capture surface.
- `attention_takeover_torch` - full-screen blur/dim with a torch-style focus area drawing attention to the next item.
- `breathing_reset` - short timed reset prompt.
- `escalated_alert` - high-priority system or push notification.
- `silent_log` - record-only, no surfaced UI.

Surfaces describe *where* the intervention renders: `in_app`, `system_notification`, `screen_overlay`, `sound`, `push`, `wearable`. Strategy and surface are independent so the same strategy can render across devices.

Intensity (1-5) lets the planning service tune the same strategy gently or sharply.

Interventions have a lifecycle: `scheduled` → `active` → `acknowledged | dismissed | completed_ritual | escalated | missed | cancelled`. Outcomes feed `BehavioralInsight`s ("torch worked 4/5 times this week") so the system learns when to escalate and when to back off.

Chaining via `escalatesToInterventionId` expresses fallback paths - desktop torch → phone push → wearable buzz - without a separate policy table. The chain is materialized at scheduling time.

### Capture Entry

A capture entry is a single raw thought captured during a brain-dump moment. Each entry is promotable to a real `Item` so a 30-second dump becomes structured work without forcing the user to commit upfront.

Status:

- `raw` - just captured, not yet processed.
- `promoted` - converted to an `Item` (the new item's id is stored on the entry).
- `dismissed` - kept for context but not promoted.

Capture entries can be linked to a `TransitionEvent` (captured between two tasks) or to a `FlowSession` (freeform capture during the day). AI agents can suggest promotions; promoting always creates a user-attributed `Item`.

### Source

A source records where an item came from:

- manual
- calendar
- slack
- email
- ai
- system

Source is not the same as actor. A calendar integration actor may create an item from a calendar source.

### Comment

Comments attach discussion, coaching, accountability notes, or AI suggestions to items.

### Invitation

An invitation is a pending access path for another user.

Examples:

- Invite Omri to a workspace.
- Invite a coach to view only agreed accountability items.
- Invite an accountability partner to comment on a specific task.

Invitations are not access by themselves. Access begins when the invited user accepts and the server creates the proper workspace membership, item assignment, or scoped grant.

### Device

A device represents one installed client or browser profile.

Devices support:

- Sync cursors.
- Push tokens.
- Notification delivery.
- Last-seen diagnostics.

Device records are user-scoped and should not be treated as trusted actors. A device can carry a user/actor session, but it does not decide permissions.

### Notification Preference

Notification preferences capture what an actor wants to hear about, through which channel, and during which hours.

Examples:

- Allow local transition reminders.
- Disable AI suggestion nudges.
- Allow coach check-in notifications.
- Respect quiet hours.

### Notification Event

A notification event is a queued or delivered nudge.

Notifications can be generated by:

- User-created reminders.
- Calendar/event timing.
- Coach/accountability partner nudges.
- AI suggestions.
- System/security events.

Notifications should be sparse and attributable.

### Usage Event

Usage events are product telemetry, not domain truth.

Examples:

- App opened.
- Task reordered.
- Focus started.
- Suggestion accepted.
- Notification opened.

Usage events should avoid task titles, reflection bodies, and calendar text.

### Activity Log

Every significant mutation writes an activity event:

- actor created item
- actor changed status
- actor added child item
- actor assigned another actor
- AI generated a suggestion
- coach sent a nudge
- notification preference changed

This becomes essential for trust, sync, undo, and collaboration.

## Derived UI View Models

Today UI should derive:

- `dateLabel`
- `datePill`
- `isOverdue`
- `timeSlot`
- priority color
- subtask progress
- event state
- current focus card
- transition prompt
- overload/flow indicators

These are not canonical domain fields.

## Current-To-v2 Mapping

| Current | v2 |
|---|---|
| `Task` | `Item(kind='task')` |
| `CalendarEvent` | `Item(kind='event')` + `ItemOccurrence` |
| `Subtask` | `Item(kind='task')` + `ItemRelation(type='contains')` |
| `Task.link` | `ItemRelation` |
| `Task.date` | `ItemPlan.date` |
| `Task.startTime` | `ItemPlan.startTime` for task anchors, `ItemOccurrence.startsAt` for events |
| `Task.slotIndex` / `slotOrder` | `ItemPlan.slotIndex` / `slotOrder` |
| `Task.done` | `Item.status` and/or `ItemAssignment.status` |
| `Task.source` | `Source` + `createdByActorId` |
