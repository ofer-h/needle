# Needle — Next Master Plan (DRAFT / requirements capture)

> Status: **DRAFT — requirements capture only.** Written 2026-05-31.
> This document captures, in full, Ofer's direction for the next push so nothing is lost.
> The *final* master plan will fold in three inputs: (1) this capture, (2) the Codex
> "Desktop-First" plan, (3) the Cursor plan (to be provided). Do **not** start
> implementing from this draft yet — it is the source-of-truth for intent, not the
> sequenced build order.

---

## 0. Why this doc exists

Ofer reviewed the studio design, several prototypes (`prototype/v2..v9`), and two AI-authored
plans (Codex "Desktop-First", and a forthcoming Cursor plan). He has a clear set of likes,
dislikes, and missing-feature calls but found it hard to commit to a single UI. Rather than
pick one prototype, he wants a **new version synthesized from what he liked**, grounded in the
real `apps/desktop` product (not another throwaway prototype).

The North Star (from Codex, endorsed): **`apps/desktop` is the product. `apps/studio` and
`prototype/*` are references only.** The goal is a desktop app that feels coherent, predictable,
and useful for a real day.

Product framing (unchanged, authoritative in `docs/positioning.md`):
**Needle is a transition coach / transition manager — not a task manager, not a timer.**
Success metric Ofer stated: *"Users should feel calmer at 2PM than they did at 9AM."*
The product reduces anxiety about forgetting important commitments.

---

## 1. What Ofer liked (keep / build on)

- **Overall `apps/studio` design language** — this is the visual baseline.
- **Timeline template** in studio — keep, but change it (see §2).
- **`screen__countdown` (next hard-stop countdown)** in studio — really liked. The always-visible
  "next hard stop" is a core idea. *Problem:* it took him a moment to understand what "next hard
  stop" meant — needs clearer labeling/affordance.
- **Commit / "unmissable" treatment** — visually nice, but **repurpose as tags** (see §2 tags).
- **The "breath" element** from `prototype/v7/index.html` — liked.
- **The "Glass Bubble Mat"** from `prototype/v7/index.html` — really nice, want it carried forward.
- **Accountability-and-scoring** concept — want it in.
- **Events & alarms model**: fixed events, "mark a place you travel to" → auto-add a hard
  "leave by" stop (e.g. school pickup). Liked and wants to generalize it (see §3).

## 2. What Ofer disliked / wants changed

- **Spacing too big.** Items *without* subtasks take too much vertical space — it reads like a
  hidden placeholder for adding a subtask. Find a nicer, compact treatment; do **not** reserve
  empty child UI space.
- **The `* item` / `** nested subtask` composer instructions** (from v7 "Add anything") are
  **confusing** as the primary UX. Plain text first; nesting/structuring should not require
  the user to learn markup.
- **Duplicate / blinking transition UI.** Today there are *two* UIs aiming at the same purpose:
  - Setting dev clock to 14:59 opens the interrupt UI.
  - Doing the dump shows a *blink* of one UI, then a dump screen, then *another* dump screen.
  - Skipping still shows the second screen.
  - These must be replaced by **one new transition UI**. Stop showing the old two.
  - The current interrupt screen is not understandable — "the torch is a very nice idea but the
    implementation/flow needs rethinking." The flow must be **predictable**.
  - His read: 14:55 should show the brain-dump UI; the second UI he sees is probably the
    *next-meeting* surface, not the dump — they are being conflated.

## 3. The central concept to get right: an event-based transition model

This is the heart of the plan. Ofer wants to stop thinking in ad-hoc "interrupt screens" and
instead model everything as **events with relations**, so the system is robust, flexible, and
extensible — and so the same model can later live in the backend and talk to AI directly.

Key ideas, captured faithfully:

- **Every timed item (meeting/event) can own its own scheduled sub-events.** Instead of hidden
  global interrupts, a meeting generates *related* events: e.g. a brain-dump session, a prep
  session, a break — each **related to the meeting itself**. Think event + relation, not
  hardcoded screens.
- **The "5/5/5" context-switch ritual**: 5 min brain dump / 5 min plan-next / 5 min break.
  Order must be **configurable** (any order), and the whole thing should be a **saved setting /
  per-user default**, overridable per event.
- **Predictability:** the user should be able to *see in advance* what events will fire around
  any item in their day (a UI / checkboxes that reflect what will happen). They may want to
  modify them. Not sure yet whether to allow editing inline — leave the door open.
- **Unified interrupt state:** the "3 hidden system events" (dump / break / prep) must be
  **surfaced to the user**. When a transition begins, all the interrupting events that arrive
  together should be reflected as **one unified state**: "you have 5 min to write down what you
  have, then a 5-min break, then 5-min prep for the next meeting."
- **Group actions on the transition:** e.g. "skip the break, ping me back in 5" should fold that
  break's time into the rest in a single click (a "declined the break" action), not require
  dismissing each surface separately.
- **Event-driven prep questions (AI/chat):** for "leave home to pick up kids, be there at 14:00"
  → behave like an alarm-event with a hard stop, and the system should *ask* the user: how long
  does it take to get there? how long to get out of the office? → implies a **chat surface** to
  collect feedback/answers from the user/AI.
- **Notification settings (missing today):** before a hard stop, *when* should we notify? Does
  the user need just a minute, or help to hard-stop and brain-dump? Configurable lead time and
  intensity.
- **Backend-ahead thinking:** keep logic local for now, but design so this event/rule engine can
  later move to the BE and be driven by AI. Everything should be **available to AI** (internal
  MCP tools mentioned as a future direction).

Implementation hint already in the repo (from Codex plan — verify before relying):
existing model reportedly supports `rituals`, `interventions`, `item_plans.relativeTo`,
`item_relations(type='prep_for')`, and a renderer concept proposed as **`TransitionSession`**
grouping all active interventions by `ritualId` / `occurrenceId` / target event.
`modal_capture`, `attention_takeover_torch`, `escalated_alert` are *surfaces of one session*.

## 4. Today surface + items

- **Today is the real working surface.** Aiming at *today*, but must handle:
  - Tasks from **yesterday / the past** → be able to target them, **move to today**, move to
    **someday (but not today)**, or **pre-plan tomorrow** (with a date).
  - Picking a specific **date**.
- **Recursive collapsible subtasks**, up to **3 visible levels now**, but the model/rendering must
  be **generic** so deeper levels can be enabled later.
  - Collapse/expand only when children exist.
  - Add child under any visible level.
  - If deeper than the visible cap, show a compact "more nested items" affordance, don't break
    layout.
  - Storage rule (from Codex — verify): do **not** reintroduce embedded durable subtasks; use
    `ItemRelation(type='contains')`; UI projects child items for display, storage stays
    item + relation.
- **Compact rows** (fixes the spacing complaint): no reserved hidden child space.
- **Delete / archive** items (explicitly missing today — "ability to delete notes/items").
- **Reordering:** drag already exists — preserve it; reorder is required.
- **Events are not checkable** (keep events distinct from tasks).
- **"On track" nudge:** show progress like "3 of 5 completed" to reassure the user they're on
  track — small kudos. Tie into accountability-and-scoring (§7).

## 5. Tags (replace row "commitment" language)

- Repurpose the nice "unmissable/committed" visual into **user-created tags**.
- Tag model: id, name, **color (semantic token)**, optional **automation metadata for future
  rules**, item↔tag assignment.
- First UI: create tag, pick color, assign/remove, render **compact chips** (don't dominate rows).
- Filter by tag later if quick.
- **Future automation:** selecting a tag could auto-create another task or trigger a rule
  ("if tag X → also create task Y"). Design the metadata hook now.
- **Important distinction (from Codex, endorsed):** keep an internal `commitmentLevel` for
  *intervention intensity*; tags are the *user-facing* categorization. Don't conflate them.

## 6. Capture / day planning / "Add anything"

Ofer is **not yet sure** how users should create tasks / plan the day. Direction:

- Default: **plain free text**, added **inline after the last item**.
- Optional **AI "fix" button**: user types whatever (messy), clicks AI → it structures into
  **editable draft blocks** (task/event/note · today/tomorrow/date/someday · fixed/flexible ·
  optional time). Raw input stays visible until confirmed. **No silent AI mutation** — persist
  only on confirm.
- **Manual add must work without AI.**
- Drop the `*` / `**` markup as primary UX.
- **Do a small research pass** on the best inline day-planning UX before finalizing (§9).

## 7. Accountability & scoring

- Want it in (liked the concept). Surface "on track" / streaks / kudos / "3 of 5 done".
- First-completion / milestone celebrations tie into the Feedback adapter (§8).

## 8. Feedback adapter — sound / haptics / celebration

- Want **sound / haptics / celebration** supported in code **by default**, but **open for change**
  (centrally configurable, gentle defaults, user can disable).
- One clean adapter with semantic events, e.g.:
  `feedback.added`, `feedback.completed`, `feedback.firstCompleted`, `feedback.captureSaved`,
  `feedback.ritualStarted`, `feedback.hardStop`.
- Examples Ofer gave: add task → sound; mark complete → sound; first-ever completion → fireworks.
- Implementation: Web Audio / Electron-safe sound first; native macOS haptics later.
- No celebration logic scattered across components — one adapter.

## 9. The always-visible next-hard-stop countdown

- Keep studio's `screen__countdown`, but make "next hard stop" **immediately understandable**.
- Should be **always visible** — next to the clock, possibly also: **app icon badge**, a
  **floating panel**, other surfaces.
- **Anti-habituation for the ADHD brain:** must change **color / animation / visibility / sound**
  over time so the brain doesn't tune it out like every other notification.

## 10. Brain dump — "very simple but powerful" (high priority, must be recorded)

This is the **key missing feature**. The app must help Ofer **commit to his day plan** and let him
**brain-dump**. Today's two attempts are (1) not really working and (2) two different UIs for the
same purpose — replace with one.

The **eventual goal** (explicitly "very very important", must be written down):

- User can **record voice while recording the screen**, narrating/telling himself the story/flow
  of what he was working on — so he can pick up where he left off.
- Can **point with the mouse / click on pages / highlight** (e.g. a URL) and it gets **captured**.
- Capture the **path of the application / active app + URL metadata**.
- Investigate what's **doable on macOS** — likely needs **Accessibility** + **Screen Recording**
  permissions. (See existing spec: `docs/superpowers/specs/2026-05-31-macos-accessibility-capture.md`
  — read and fold in.)
- **Auto-capture last 5–10 minutes** as a **rolling "time machine"** buffer the user can reach back
  into.
- **Countdown** on the time available for the memory-dump video.
- A **chat** the user can type/speak into during/around the dump: "do this", "add this", "remember
  this", "need to check this" → may use **internal MCP tools**.
- **Research task (§ research):** survey nice ideas / extra capabilities here that Ofer didn't think
  of; write a doc; think about more capabilities.

## 11. Versioning / undo of AI changes

- Want **versioning of tasks/data**. If the AI changes something from a chat (e.g. user gave the
  wrong ticket id/name), the user must be able to **revert**.
- Future: drive from the **phone** by voice, see changes animate live on the desktop UI.

## 12. Settings (missing today, needed)

- Configure a meeting/event with a **hard start** → must know if we need **prep time**.
- **Travel time** toggle → auto "leave by" hard stop.
- **5/5/5 ritual** toggles + order + whether generated moments appear in the Today timeline.
- **Notification lead time + intensity** before hard stops.
- **Accessibility-based meeting detection (research):** can we detect via macOS accessibility
  whether the user actually *joined* a meeting / is in one? Track attendance.
- Per-user saved defaults for the context-switch ritual.

---

## 13. Open research questions (do before finalizing the master plan)

1. **Inline day-planning UX** — best pattern for free-text-first capture with optional AI
   structuring into editable blocks (small research pass). (§6)
2. **macOS storytelling capture** — screen+voice recording, cursor highlight, active app/URL via
   Accessibility, rolling 5–10 min time-machine buffer, permissions model, additional capability
   ideas. Cross-reference `docs/superpowers/specs/2026-05-31-macos-accessibility-capture.md`. (§10)
3. **Meeting-attendance detection** via macOS accessibility. (§12)
4. **Anti-habituation countdown** patterns for ADHD (color/motion/sound rotation). (§9)
5. **Event/rule engine shape** — how to model events + relations + rituals so it's local now but
   BE/AI-drivable later, and exposable to AI (MCP tools). (§3)

---

## 14. Draft phased plan (to be reconciled with Codex + Cursor plans)

> This mirrors the Codex "Desktop-First" sequencing, which Ofer pasted and broadly endorses, and
> layers in his additions. Each phase is written to be handed to a **subagent (possibly a smaller
> model)** and several are **parallelizable**. Final ordering/ownership lands in the master plan.

**P0 — Stabilize desktop.** Branch off; baseline `pnpm --filter @needle/desktop typecheck|lint|test`;
fix only blockers (incl. any `better-sqlite3` ABI drift). Document truth. *(Serial, gate.)*

**P1 — One predictable TransitionSession flow.** Collapse `modal_capture` + torch + escalated alert
into a single session keyed by ritual/occurrence/event. 14:55/14:59/15:00 never show duplicate dump
UIs; `brainDumpText` saved once; outcomes still recorded. *(Serial-ish; depends on P0.)*

**P2 — Today surface cleanup.** Compact rows, no hidden child space, delete/archive, date-target
actions (today/tomorrow/date/someday), preserve drag, events non-checkable. *(Parallel with P3.)*

**P3 — Recursive collapsible subtasks (3 levels, generic).** Tree render via
`ItemRelation(type='contains')`; collapse state; depth cap with overflow affordance. *(Parallel P2.)*

**P4 — Inline capture composer.** Plain-text-first; optional AI "fix" → editable blocks; confirm to
persist; no silent mutation. *(Depends on P2; research §13.1 first.)*

**P5 — Events, rituals, leave-by preview + Settings.** Event settings panel (hard start, duration,
prep, travel, buffer); 5/5/5 toggle + order; show generated moments in Today; leave-by hard stop;
notification lead-time settings. Generated blocks visually linked to event & inspectable.
*(Depends on P1's session model.)*

**P6 — Tags.** Replace user-facing commitment language; tag CRUD + color token + compact chips +
assignment; keep internal `commitmentLevel`; automation-metadata hook for future rules.
*(Parallel-ish.)*

**P7 — Feedback adapter.** One adapter, semantic events, gentle defaults, central enable/disable;
wire add/complete/firstComplete/captureSaved/ritualStarted/hardStop. *(Parallel-ish.)*

**P8 — Always-visible countdown + anti-habituation.** Clarify "next hard stop"; surface in clock +
app icon + floating panel; rotate color/motion/sound. *(Depends on event model.)*

**P9 — Accountability & scoring.** "3 of 5 done", streaks, kudos, milestone celebrations via P7.

**P10 — Brain-dump capture track (phased, mostly research → spike).** Simple dump now; then voice+
screen recording, cursor highlight, active app/URL via Accessibility, rolling time-machine buffer,
in-dump chat, countdown. Gated behind research §13.2/§13.3. *(Largely independent research/spike.)*

**P11 — Versioning / undo of AI-driven changes.** Data versioning + revert; foundation for
phone-driven voice edits later. *(Independent, design-first.)*

**P12 — Documentation track.** Keep desktop status, transition-session architecture, ritual/event
generation, and the macOS capture future-track docs current.

**Design-system spine (cross-cutting):** carry studio's language + v7's "breath" and "Glass Bubble
Mat" into `packages/ui-web`; semantic tokens only; light+dark; per the `ui-web.mdc` rule. Feeds P2,
P8, P10.

---

## 15. What's deferred until the Cursor plan arrives

- Final phase ordering, ownership split, and parallelization map.
- Reconciling any conflicts between Codex, Cursor, and this capture.
- Concrete file-level task breakdown per subagent (the master plan must be implement-ready and
  splittable across AI tools working in parallel).

> Next action when resumed: read the Codex plan in full, the Cursor plan (when provided), the
> referenced prototypes (`v7`, studio), `apps/desktop` intervention/today code, and
> `docs/superpowers/specs/2026-05-31-macos-accessibility-capture.md`; run the research passes in
> §13; then write `docs/v2/needle-next-master-plan.md` (the real, sequenced, subagent-ready plan).
