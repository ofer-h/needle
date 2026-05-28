# Product Direction - AI-Guided Daily Flow

This document is the north star for v2 architecture and product work.

## Vision

Needle is a calm AI-assisted daily operating system for intentional work and life flow.

It should help people:

- Stay focused on today.
- Transition consciously between tasks.
- Balance hard-time commitments with flexible tasks.
- Reduce overwhelm and context switching.
- Build self-awareness and accountability over time.
- Feel guided, not managed.

The product should feel closer to:

- A calm AI companion.
- A daily operating system.
- A lightweight personal workflow coach.

It should not feel like another overloaded task manager.

## Product Principles

### Today-first

Today is the primary surface.

Future planning exists, but it should support the active day, not become a backlog maze.

### Flexible structure

Hard-time commitments and flexible tasks are different.

Hard-time commitments:

- Fixed time.
- Fixed order.
- Cannot overlap/reorder freely.

Flexible tasks:

- Movable.
- Reorderable.
- Adaptive to energy/context.
- May have duration estimates.

Architecture mapping:

- Hard-time commitments are `Item(kind='event')` plus `ItemOccurrence`.
- Flexible tasks are `Item(kind='task')` plus actor-scoped `ItemPlan(mode='float')`.
- Anchored tasks use `ItemPlan(mode='anchor')`.

### Intentional transitions

The space between tasks matters.

Needle should eventually support:

- Closing the previous task.
- Resetting mentally.
- Starting the next task with intent.
- Short reflection prompts.
- AI-generated transition guidance.

Architecture mapping:

- `FlowSession` represents the active daily flow for an actor/date.
- `FocusSession` represents time spent on an item.
- `TransitionEvent` represents task-to-task state changes.
- `Reflection` records lightweight completion/transition notes.

### Accountability without aggression

Needle should encourage consistency without guilt.

Tone:

- Supportive.
- Reflective.
- Adaptive.
- Human.

Avoid:

- Shame mechanics.
- Streak obsession.
- Aggressive productivity culture.

Architecture mapping:

- Accountability partners are `Actor(kind='accountability_partner')`.
- Coaching relationships are `ItemAssignment(role='coach' | 'accountability_partner')` or comments/suggestions from those actors.
- Metrics should track clarity/control and reduced overwhelm, not only raw throughput.

### AI as companion, not operator

AI should:

- Guide.
- Observe patterns.
- Suggest improvements.
- Help prioritize.
- Notice overload.

AI should not:

- Fully take over.
- Constantly interrupt.
- Become noisy.
- Optimize only for efficiency.

Architecture mapping:

- AI is an `Actor(kind='ai_agent')`.
- Suggestions are first-class `Suggestion` records.
- Behavioral observations are `BehavioralInsight` records.
- AI changes should be optional, visible, reversible, and attributed.

## MVP Product Shape

Primary screen:

- Today timeline.
- Current focus.
- Upcoming flexible work.
- Free-text capture that shows original text and editable AI-generated planning blocks before anything is committed.

MVP features:

- Timed events as anchored blocks.
- Flexible tasks that can be reordered.
- Current focus state.
- Lightweight completion reflection.
- Subtle contextual AI suggestions.
- Multi-intent parsing for capture text, with user-controlled confirmation, editing, split/merge/remove, and task/event conversion.

## AI Capture Review Loop

Free-text capture is the first AI-native planning moment. It should preserve the user's words, then show the parsed structure underneath as draft blocks.

Rules:

- The raw capture text stays visible while reviewing generated blocks.
- AI may split text into multiple tasks/events, but drafts remain editable before confirmation.
- Fixed-time events and flexible tasks must remain visually and structurally distinct.
- A suggested time does not remove control: users can change a block between flexible and fixed.
- Confirming creates normal task/event records; dismissing leaves the user free to try again or save raw capture.
- Future pipeline stages should stay separable: extraction, metadata enrichment, validation/cleanup, then explicit user acceptance.

## Future Product Shape

AI behavioral layer:

- Energy patterns.
- Focus hours.
- Procrastination patterns.
- Realistic planning capacity.
- Emotional/mental load signals.
- Recovery time awareness.

Integrations:

- Calendar.
- Slack.
- Email.
- Apple Reminders.
- Notion.
- Linear/Jira.
- Wearables.
- Location awareness.

Ambient intelligence:

- Missed meetings.
- Slack mentions.
- Overload indicators.
- Context switching.
- Long inactivity.

The system should surface gentle awareness, not a stream of nagging notifications.

## Success Metrics

Initial:

- Daily active usage.
- Users reorganizing tasks during the day.
- Reduced task rollover.
- Session return frequency.
- Subjective feeling of clarity/control.

Long term:

- Habit formation.
- Reduced overwhelm.
- Improved intentionality.
- Sustained engagement without addiction mechanics.
