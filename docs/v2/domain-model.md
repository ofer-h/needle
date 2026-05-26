# Needle v2 Domain Model

## Principles

Needle should model work, memory, time, and support relationships in a way that survives desktop, web, sharing, and AI.

Core principles:

- Items are the center of the product.
- Subtasks are child items, not embedded checklist rows.
- Scheduling is separate from item identity.
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

### Activity Log

Every significant mutation writes an activity event:

- actor created item
- actor changed status
- actor added child item
- actor assigned another actor
- AI generated a suggestion

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
