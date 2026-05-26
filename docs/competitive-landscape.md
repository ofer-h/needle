# Competitive Landscape

**Product:** Needle (working name: Focus)  
**Date:** 2026-05-26  
**Source:** Repo analysis (`PRD.md`, `memory/context.md`) + market research

---

## What Needle Is

Needle is a macOS desktop app for software engineers with ADHD. It acts as an intelligent second brain:

1. **Capture** anything (text, voice, images, files)
2. **AI classifies** into two buckets — **Remember** (retrieve later) or **Act** (do something)
3. **Today** surfaces the right things at the right time, with calendar woven into a timeline

v1 scope: **Today + Capture** only. Local-first (SQLite). Not a to-do app — a **life management layer**.

---

## What the Repo Itself Says

### Named as the problem (too much manual organization)

| Tool | Why it's called out |
|------|---------------------|
| **Notion** | User must decide folders, categories, structure |
| **Todoist** | User must decide what it is and when it's due |
| **Apple Reminders** | Same friction at capture time |

From `PRD.md`:

> Existing tools (Notion, Todoist, Apple Reminders) require the user to decide where things go, what category they belong to, and when they're due. That friction causes avoidance, and things fall through the cracks.

### Design inspiration (not positioned as competitors)

- **Arc** — software with a strong point of view about how you live
- **Cron / Vimcal** — a calendar that feels alive, not bureaucratic
- **Daylio** — emotional relationship with your day, not just data

### Needle's stated differentiation

- Not a to-do app — a **life management layer**
- Only two buckets: **Remember** vs **Act** (no folders, tags, or taxonomy)
- **Zero-decision capture** — AI decides bucket, time, links, title
- **Today** is a timeline (fixed + flexible tasks + calendar), not a guilt list
- **macOS-native** desktop, local-first, global capture shortcut
- v1 scope: **Today + Capture** only

---

## Closest Competitors (by overlap)

### Tier 1 — Most similar thesis: "capture → AI organizes → surface what to do"

| Company / product | Overlap | Where Needle differs |
|-------------------|---------|----------------------|
| **[Saner.AI](https://saner.ai)** | Built for ADHD; brain dump → tasks; auto-tagged notes; proactive check-ins | Needle is macOS desktop, local-first, two-bucket model, no email/inbox hub |
| **[Pith](https://www.trypithapp.com)** | Messy notes → auto-extracted tasks; "Focus" view with Do Now / Coming Up | Needle adds Remember bucket, calendar timeline, voice/file capture, macOS widget |
| **[Second Brain AI](https://apps.apple.com/us/app/second-brain-ai/id6758251901)** (App Store) | Siri capture, AI classification, calendar/contacts sync, daily digest | Needle is deeper on Today timeline + ADHD-specific scheduling model |
| **[Mind](https://www.m-i-n-d.ai/)** | Personal knowledge OS; auto-classify, extract tasks, calendar integration | Much broader platform (graph, 45 tools, social); Needle is narrow and calm |

These are the closest to Needle's **"you never decide where things go"** pitch.

### Tier 2 — AI scheduling / calendar-first (overlap on Today + calendar)

| Company / product | Overlap | Where Needle differs |
|-------------------|---------|----------------------|
| **[Motion](https://www.usemotion.com)** | AI schedules tasks into calendar; auto-reschedules | Motion is project/work-manager shaped; user still structures work; Needle is capture-first |
| **[Reclaim.ai](https://reclaim.ai)** | AI blocks focus time, tasks, habits on calendar | Layers on existing task tools; doesn't replace capture/classification |
| **[Akiflow](https://akiflow.com)** | Unified inbox, time-blocking, light AI tagging | Keyboard-first manual planner; user still triages |
| **[Morgen](https://www.morgen.so)** | Calendar + tasks in one place | Less "AI decides everything at capture" |
| **[Sunsama](https://sunsama.com)** | Daily planning ritual, calendar + tasks | Guided manual planning, not zero-decision capture |

Overlap is mainly **Today view + calendar integration**, not the **Remember/Act** capture model.

### Tier 3 — Traditional productivity (named in PRD + adjacent)

| Company / product | Overlap | Gap vs Needle |
|-------------------|---------|---------------|
| **Todoist** | Fast capture, natural language dates | Still a list app; user owns structure |
| **Notion** | Notes + tasks + AI | High setup/organization burden |
| **Apple Reminders** | Native macOS, Siri capture | No AI classification, no second-brain layer |
| **Things 3** | Beautiful macOS task app | Manual organization |
| **OmniFocus** | Power-user GTD on Mac | High cognitive overhead — opposite of Needle's thesis |
| **Linear** | Engineer workflow | Issue tracker, not personal life layer |

### Tier 4 — PKM / "second brain" (Remember bucket overlap)

| Company / product | Overlap |
|-------------------|---------|
| **Obsidian**, **Notion**, **Reflect**, **Tana**, **Capacities**, **Amplenote** | Store + retrieve knowledge |
| **[Mem.ai](https://mem.ai)**, **[thesecondbrain.io](https://www.thesecondbrain.io/)** | AI auto-tagging and semantic search |

These compete on **Remember**, but usually still expect the user to organize or browse. Needle explicitly avoids a Remember browsing screen in v1 (search only).

### Tier 5 — macOS capture / ambient memory (partial overlap)

| Company / product | Overlap |
|-------------------|---------|
| **Raycast** | Global shortcut, quick capture, AI extensions |
| **Mnemora**, **Focusd** | Screen-aware work memory, semantic search |
| **ADHD Focus Mate** | macOS menu bar, AI watches focus (distraction nudging) |

Different job: **ambient capture** or **focus enforcement**, not structured Remember/Act.

### Tier 6 — ADHD-specific (adjacent, not direct substitutes)

| Company / product | What they do |
|-------------------|--------------|
| **[Tiimo](https://www.tiimoapp.com)** | Visual timeline, break tasks into steps |
| **Inflow**, **Goblin Tools** | ADHD coaching / task breakdown |
| **Focusmate** | Body-doubling accountability sessions |

Useful for the same user, different problem (getting started vs organizing input).

---

## Competitive Position

Needle sits in a relatively open position: **low manual organization + life-layer / second brain**, not task-list shaped.

```
                    Life layer / second brain
                              ↑
                              |
         Saner.AI ●           |           ● Obsidian
              Pith ●          |      ● Notion
           Needle ●           |
                              |
    ← Low manual org —————————+————————— High manual org →
                              |
         Motion ●             |
         Reclaim ●            |      ● Todoist
                              |
                              ↓
                         Task / list app
```

**Direct competitors to watch:** Saner.AI, Pith, Second Brain AI, and to a lesser degree Mind.

**Indirect competitors** (users might use instead of Needle for part of the job): Motion/Reclaim/Akiflow for scheduling, Todoist/Reminders for quick capture, Obsidian/Notion for notes.

---

## Open Questions

- Pricing and positioning vs Saner.AI and Pith (both ADHD-adjacent, AI-first)
- Whether "local-first, no cloud" is a differentiator or a limitation for the target user
- How much calendar auto-scheduling (Motion/Reclaim territory) belongs in v1 vs later
- Final product name — "Focus" is a placeholder per PRD

---

## Update Protocol

Refresh this doc when:

- A direct competitor ships a feature that overlaps with Today or Capture
- Needle's v1 scope or differentiation changes
- Pricing/positioning research is done for top-tier competitors
