# Office Hours

This folder holds outputs from `/office-hours` — a `gstack` skill that runs a YC-style product diagnostic conversation. Each session produces a dated design doc captured here, plus an entry in [`SESSIONS.md`](SESSIONS.md) so we can scan the arc over time.

If you don't know what this is, read this file in 5 minutes.

## What `/office-hours` does

It's a structured interrogation that forces premise-checking before code. You invoke it by typing `/office-hours` to Claude Code. It then walks 6 phases:

1. **Context gathering** — reads `PRD.md`, `CLAUDE.md`, the repo, prior design docs.
2. **Mode selection** — startup / intrapreneurship / hackathon / learning / personal. Decides whether you get pushed (YC mode) or riffed with (builder mode).
3. **Six forcing questions** — demand reality, status quo, desperate specificity, narrowest wedge, observation, future-fit. Smart-routed by product stage (pre-product gets Q1/Q2/Q3/Q4 only).
4. **Landscape awareness** — optional web search to inform pushback with what the market already does.
5. **Premise challenge** — surfaces 5-10 premises the founder has to explicitly agree with. Disagreement loops back to Phase 2.
6. **Cross-model second opinion** *(optional)* — dispatches an independent Claude subagent (or Codex CLI if installed) with a structured summary of the session. The subagent has *no* conversation context. Returns a cold-read steelman, key quote, weakest premise, and 48-hour build proposal.
7. **Alternatives generation** — 2-3 approaches (minimal viable / ideal architecture / lateral) with effort/risk/pros/cons.
8. **Design doc + spec review** — writes the doc, then dispatches another fresh subagent to adversarially review it across 5 dimensions (completeness, consistency, clarity, scope, feasibility). Iterates up to 3 times.
9. **Closing** — assignment (what to do next, *not* "go build it"), founder-signal reflection, suggested next skills.

## What it explicitly **doesn't** do

- It does not write code. Hard gate.
- It does not scaffold projects.
- It does not let you skip the questions unless you push back twice (and even then it still runs premise challenge + alternatives).

## Why it exists

The default failure mode for technical founders is "build first, validate later." Office hours is the forcing function that flips that order. The exit always includes a concrete real-world action (an observation, a conversation, a question to ask a specific person) — never just "go build it."

## How to invoke

In Claude Code:

```
/office-hours
```

It will pick up `PRD.md`, scan recent git activity, and ask you Phase 1 questions one at a time. Sessions typically last 30-60 minutes and produce a single markdown design doc.

## How outputs are stored

Two locations, by design:

- **In this repo:** `docs/office-hours/YYYY-MM-DD-<wedge-name>.md` — committed, version-controlled, reviewable by Omri.
- **Cross-machine cache:** `~/.gstack/projects/ofer-h-needle/<user>-<branch>-design-<datetime>.md` — outside the repo, so downstream skills (`/plan-eng-review`, `/plan-ceo-review`, `/plan-design-review`) can discover the latest design across branches.

## Suggested cadence

- **First session** when starting a meaningfully new product direction.
- **Follow-up session** every 1-2 weeks once you have observation data or new evidence — the second session benefits from a relationship the skill has with you (it adapts via a "builder profile" stored in `~/.gstack/developer-profile.json`).
- **Before any non-trivial architecture pivot** — premise challenge catches the "we already decided" trap.

## What lives in this folder

- `README.md` — this file.
- `SESSIONS.md` — index of all sessions on this repo, newest first. Update at the end of each session.
- `YYYY-MM-DD-<wedge-name>.md` — one file per session.

## Suggested next skills after `/office-hours`

The closing always names these, but for reference:

| Skill | When to run |
|---|---|
| `/plan-eng-review` | After approving a design doc — locks architecture, edge cases, sequencing |
| `/plan-design-review` | When the design doc has UI components — visual taste pass |
| `/plan-ceo-review` | When you want to test if the wedge is *ambitious enough* |
| `/autoplan` | When you have a plan and want the full review pipeline run for you |
| `/codex` | Independent second opinion via OpenAI Codex CLI |
| `/ship` | Once code is ready, runs the merge + PR flow |

## See also

- `/Users/groot/.claude/skills/office-hours/SKILL.md` — full skill source (Anthropic Skill spec).
- `~/.gstack/analytics/` — local-only telemetry (skill runs, durations, quality scores).
- `~/.gstack/developer-profile.json` — accumulated builder profile across sessions.
