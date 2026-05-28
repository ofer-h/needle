# Accountability & Scoring (transition-ritual adherence)

**Status:** concept / captured brain-dump (2026-05-28). Where and how to implement
is still open — this doc captures the intent and the decisions to make later.

This extends the transition-coach thesis ([`../positioning.md`](../positioning.md))
and the [`product-direction.md`](./product-direction.md) sections "Intentional
transitions" and "Accountability without aggression." It is product behavior, not
yet a data-model or implementation design.

## The mechanic: timeboxed transition rituals

A transition is not one moment — it can be a short sequence of intentional
sub-blocks the user commits to. Worked example:

> Meeting in 15 minutes. The user blocks it as:
> - **5 min — memory dump** (offload what's currently held in the head)
> - **5 min — plan the next meeting**
> - **5 min — break**

The product's job is to run that ritual *and notice what actually happened*.

## Adherence signals to capture

For each ritual and each sub-block, monitor and record:

- **Completed vs. skipped** — one block, or all of them.
- **Postponed** — e.g. the user hits "postpone 3 min" because they need to fix
  something first. Record it *and* its knock-on cost (a postpone often eats into
  the break that follows).
- **Repeated patterns** — the same block skipped/postponed again and again
  (especially skipping the break — a signal worth surfacing).
- **On-time arrival** — did they make it to the meeting on time.
- **Plan-vs-actual** — did they actually do the thing they planned to do.

All of this is captured as metrics (fits the existing `usage_events` /
`activity_log` streams in `architecture-guidelines.md` §10 and
`sync-access-observability.md`).

## Accountability delivery — three modes (user-selectable, privacy-first)

The same adherence data can be surfaced in three different ways. The user chooses;
nobody is forced into being watched.

1. **Gamification / scoring.** A score (streak/consistency), optionally compared
   between employees or teammates on the same system (a leaderboard). Opt-in.
2. **Coached.** If the user is connected to a coach, push adherence data to the
   coach so they can act — the coach is an `Actor(kind='coach')`. The coach sends
   an encouraging, human nudge. In the founder's words:
   > "Ofer, I know it's hard, but you can do it. Take a breath, do the memory
   > dump, let's commit to it and see how it feels."
3. **Self-accountability (private).** For people who don't want to be judged or to
   share their data — this must be first-class, not an afterthought. Either:
   - an **AI-generated** encouragement, or
   - a message the user **writes to their future self**, replayed at the moment:
     > "Hey, it's me from the past. I can do it, I want to. Let's do it."

**Tone guardrail (non-negotiable):** per `product-direction.md` "Accountability
without aggression" — supportive, reflective, no shame mechanics, no streak
obsession. Scoring/leaderboard is opt-in; the private/self mode is a peer of the
others, never a downgrade.

## Domain hooks (build on what already exists)

- **Transitions:** `TransitionEvent`, `Reflection`, `FlowSession`, `FocusSession`
  (product-direction "Intentional transitions"). A ritual is a sequence over these.
- **People:** `Actor(kind='accountability_partner' | 'coach')`,
  `ItemAssignment(role='coach')` (product-direction "Accountability without aggression").
- **AI:** `Actor(kind='ai_agent')`; nudges/encouragements as `Suggestion` records,
  optional and attributed — never silent.
- **Metrics:** `usage_events` + `activity_log`.

## Open questions — where & how to implement

- **Where does the "accountability manager" run?** Likely split along the two-path
  model ([`monorepo-migration-plan.md`](./monorepo-migration-plan.md)):
  - **Local (Mac / Path A):** real-time ritual monitoring + metric capture. This
    must work offline and react in the moment, so it lives on-device.
  - **Cloud (Path B):** cross-user scoring/leaderboards and coach push need the
    backend. They consume the same captured metrics once synced.
- **New domain entities needed:** a *ritual instance* (sub-blocks + per-block
  adherence outcome: done/skipped/postponed + knock-on cost), a *score/streak*
  record, and *self-authored encouragement messages*. Add to `data-model.md` when
  designed.
- **Privacy model:** a per-user setting for which mode(s) are active, and exactly
  what data leaves the device for the coach or leaderboard.
- **Scoring function:** what does it reward? Per product principles, reward
  consistency and clarity, not raw throughput — and avoid anything that reads as
  punishment.
- **Coach delivery channel:** how the nudge reaches the coach (ties into
  `NotificationsModule`, later).
