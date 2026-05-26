# Needle Glossary

This glossary keeps product language, UI labels, and implementation terms aligned.

| Term | Meaning |
|---|---|
| Item | Anything in the system. Today this means a task or calendar event. |
| Act | Bucket for things the user needs to do. Act items can be planned, completed, rescheduled, or moved. |
| Remember | Bucket for things the user wants stored and retrievable later. Remember items are not primary Today surface content. |
| Anchor | UI-facing term for time-pinned work. Internally this is still `scheduleKind: 'fixed'`. |
| Float | UI-facing term for work that can drift between anchors. Internally this is still `scheduleKind: 'flexible'`. |
| Block | A time-anchored row on the timeline, such as a meeting or Anchor task. |
| Source | Where an item came from, such as manual capture, calendar, Slack, or email. |
| Plan | The act of assigning an item to a specific future day. |
| Stash | The pool of Act items that exist but are not yet placed on a specific day. |

Implementation note: keep `fixed` / `flexible` in TypeScript until the DnD and timeline internals are stable. Use Anchor / Float in user-facing UI and docs.
