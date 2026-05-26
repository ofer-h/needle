# Current Model Audit

Date: 2026-05-26

## Summary

The current Needle model is good for proving the Today UI, but it is not ready to become the persistence model. It mixes domain state, view state, and mock-only convenience fields in one `Task` shape.

The most important correction: embedded `Subtask[]` should not become permanent. Subtasks need to be first-class items connected by relations.

## Current shape

Current shared types:

- `Task`
- `CalendarEvent`
- `Subtask`
- `Relation`
- `SourceId`

Current store:

- Keeps all data in Zustand mock arrays.
- Stores subtasks inside a parent task.
- Stores scheduling fields directly on task rows.
- Stores UI labels such as `dateLabel`, `datePill`, `kind`, and `isOverdue` beside canonical-ish fields.

## Findings

### P0 - Embedded subtasks will block collaboration

`Task.subtasks?: Subtask[]` makes child work invisible to assignment, sharing, planning, comments, history, and permissions.

Required direction: every subtask is an `Item`, connected to its parent through `ItemRelation(type = 'contains')`.

### P0 - Users and actors are missing

The future product needs real humans, AI coaches, accountability partners, integrations, and system actions.

Required direction:

- `User` is only a login/account.
- `Actor` is anything that can create, update, coach, sync, or be assigned.

### P0 - Scheduling is stored too close to the task

Current fields such as `date`, `startTime`, `slotIndex`, and `slotOrder` live directly on `Task`.

That breaks down when:

- A shared item is planned by two users on different days.
- A child item is planned independently.
- A calendar event occurrence recurs.
- Web and desktop need to sync local edits.

Required direction:

- `Item` stores identity and content.
- `ItemPlan` stores per-actor planning.
- `ItemOccurrence` stores anchored time blocks/events.

### P1 - View fields are mixed with canonical fields

Fields like `dateLabel`, `datePill`, `kind`, `isOverdue`, and `timeSlot` should be derived by Today/Capture view logic.

Required direction: keep these in selectors/view models, not DB rows.

### P1 - Relations are display-driven

Current `link?: string` and `relations?: Relation[]` are useful hints, but long-term relations must identify real items/actors and carry relation type, provenance, and ordering.

### P1 - No audit log

For collaboration and AI actors, we need to know who changed what and why.

Required direction: every meaningful mutation writes an `ActivityLog` entry with `actorId`.

## Near-term correction

Before adding more edit UI, introduce the v2 domain contract and then refactor the mock store toward it behind the existing Today UI.

Do not build a database yet. First make the model true.
