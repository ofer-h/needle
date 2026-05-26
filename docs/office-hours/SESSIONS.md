# Office Hours — Session Log

Newest first. One row per `/office-hours` session. Add a row at the end of every new session.

| Date | Session | Mode | Wedge / Outcome | Doc |
|---|---|---|---|---|
| 2026-05-26 | #1 — Hard Stop Coach reframe | Startup | Reframed Needle from "ADHD second brain" to **"Hard Stop Coach"** — kit of attention interventions at hard stops (meetings, lunch, manual triggers). PRD v1 paused; PRD v2 + torch promoted to v1. Approach B (Kit Foundation) chosen. 10-14 day ship target. | [2026-05-26-hard-stop-coach-wedge.md](2026-05-26-hard-stop-coach-wedge.md) |

## Session #1 — 2026-05-26 — quick narrative

Ofer ran `/office-hours` after a 2 AM repo audit. Goal: align on what Needle actually is, given two competing PRDs and a v2 architecture that had outrun real usage.

**Mode:** Startup. Pre-product. 8/8 founder signals observed (top tier).

**The arc:**
1. Demand check exposed 1 warm lead (Alon, VP Product at AI/insurance company) — verbal interest, no behavior, no money.
2. The load-bearing quote from Ofer about Alon: *"switch between metting - hard stop, context swich, mental mode of letting go to be able to move to next meeting."* This is the entire product spec.
3. **Eureka moment:** Ofer's most-shipped feature (the torch + brain-dump + ritual) maps 1:1 onto Alon's named pain. The two competing PRDs were arguing because v1 was the *saturated* "AI second brain" thesis (Saner.AI lane) and v2 + torch was the *unsaturated* "attention interruption" thesis. Alon's words picked v2.
4. Ofer corrected the initial wedge framing twice — first surfacing the "kit, not a single torch" thesis (variety defeats habituation; ADHD brain needs novelty), then broadening target users from "calendar-heavy operators" to "anyone who benefits from intentional hard stops, regardless of trigger source."
5. Final product noun: **the "hard stop."** Calendar is one trigger; lunch, on-track check-ins, and manual `⌘⇧K` are others. Two intervention strategies ship together (torch + ambient pill) to test the rotating-kit thesis from day 1.

**What was cut from v1 scope:**
- Today screen (parked behind a debug flag)
- Remember / Act buckets
- Capture screen as standalone
- AI classification
- Subtasks UI polish
- Capture inbox / semantic search
- Multi-app, mobile, web, NestJS, sync, monorepo

**What's locked for v1:**
- 3 trigger sources: calendar (EventKit), user-authored time-of-day, manual ⌘⇧K
- 2 intervention strategies: torch (unmissable), ambient pill (firm)
- Context-aware brain-dump prompts per trigger type
- Escalation ladder: `ambient_pill → torch → escalated_alert` on 3 dismiss-under-2s in 7-day window
- Local SQLite (better-sqlite3) for instrumentation
- Notarized .dmg + Cloudflare Worker + Stripe entitlement at $20/mo

**The assignment (before any code):**
1. Apple Developer enrollment (24-48h lead time)
2. Observation A: watch Alon for 1 hour, no software demo
3. Observation B: 3 days of manual hard-stop alarms on Ofer's own phone, handwritten dumps
4. Sync with Omri (30 min) to align on cutting PRD v1 scope
5. Then build

**Premise revisions in-session:**
- #2 (mapping) — challenged by subagent, strengthened by Ofer's 2.5y ADHD-coaching domain expertise
- #8 (NEW) — product is a *kit* of rotating interventions, not the torch alone
- #9 (NEW) — brain dump is therapeutic (act of dumping = 90% value), not archival

**Adversarial spec review:** 3 rounds, final score 8.5/10. Caught duplicated success-criteria rows, "torch unreachable in week 1" consistency bug, optimistic 1-week estimate, missing Apple Developer enrollment lead time, undercounted Cloudflare Worker scope.

**Next skills the closing recommended:**
- `/plan-eng-review` on the design doc — for architecture and build sequencing
- `/plan-design-review` for ambient pill + scheduling UI before drawing pixels
- `/office-hours` again in 1-2 weeks once observation data exists
