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
