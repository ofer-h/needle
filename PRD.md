# Focus — Product Requirements Document
**Version:** 0.2 | **Date:** May 2026 | **Owner:** Omri and Ofer

---

## Executive Summary

Focus is a macOS desktop app built for a software engineer with ADHD. It acts as an intelligent second brain — absorbing anything thrown at it (text, voice, images, files), classifying it automatically using AI, and surfacing the right things at the right time. The app removes the cognitive burden of organization entirely. The user never decides where something goes. The AI does.

v1 is intentionally scoped to two screens: **Today** and **Capture**. Everything else is secondary.

Built as an Electron app using Cursor, the project also serves as a hands-on AI engineering learning experience for its primary user.

---

## Problem Statement

People with ADHD generate high volumes of mental input — tasks, ideas, things to remember, things to act on — but the act of *organizing* that input is itself cognitively expensive. Existing tools (Notion, Todoist, Apple Reminders) require the user to decide where things go, what category they belong to, and when they're due. That friction causes avoidance, and things fall through the cracks.

Focus removes that friction entirely. The user captures anything, the AI decides what it is and what to do with it, and the app keeps track — including linking related things (like a calendar event and its prep task) automatically.

This is not a to-do app. It is a life management layer.

---

## Goals & Non-Goals

**Goals:**
- Zero-friction capture: one input box, any format
- AI-powered classification with no required user decisions at capture time
- Two mental buckets: **Remember** (retrieve later) and **Act** (do something)
- Smart scheduling with human-friendly time options
- Calendar integration that spawns action items automatically
- ADHD-optimized Today view: alive, scannable, not a list
- macOS widget + notification support
- AI that learns Ofer over time through feedback

**Non-Goals (v1):**
- Email integration → v2
- Mobile app
- Collaboration / multi-user
- Manual folders, tags, or taxonomy
- Web clipper or browser extension
- A Remember browsing screen (search only, not a primary surface)

---

## Core Concepts

### The Two Buckets

| Bucket | What it is | User effort |
|---|---|---|
| **Remember** | Things to store and retrieve — facts, references, notes, ideas | Zero at capture. Search when needed. |
| **Act** | Things that require doing | Optional: confirm or change the AI's suggested time |

Items can be linked. A calendar event can generate an Act item. A Remember item can be promoted to Act. The AI manages these relationships silently, without asking.

### Time Model for Act Items

| Label | Meaning |
|---|---|
| Today | Due today |
| Tomorrow | Due tomorrow |
| In a couple of days | 2–3 days out |
| Next week | Same weekday, next week |
| Next [weekday] | e.g. "Next Sunday" |
| Someday | No date — lives in backlog |

The AI pre-selects the most appropriate option. The user confirms or overrides in one tap.

---

## Screens — v1 Scope

### Screen 1 — Today

The primary and default screen. The user opens the app and lands here every time.

**What it shows:**
- Act items due today, sorted by urgency (overdue first, then by time)
- Act items due in the next 2–3 days, with progressively lower visual weight the further out they are
- Calendar events for today and tomorrow, woven in chronologically — not in a separate section
- A day-level progress indicator (items done / items total) — subtle, not prominent

**What it does NOT show:**
- Remember items (not the user's job to process these on the main screen)
- Someday backlog (accessible separately, not pushed)
- Anything more than ~7 items before collapsing

**Behavior:**
- Completing an item triggers a satisfying animation — the item dissolves, a counter ticks up
- Tapping an item expands it inline: shows original raw input, AI reasoning, quick actions (reschedule, move to Remember, delete)
- Calendar events are read-only but tappable — tapping one shows any linked Act items the AI generated

---

### Screen 2 — Capture

A dedicated full-screen capture experience. Accessed via:
- A persistent floating button / shortcut on the Today screen
- Global macOS keyboard shortcut (works from any app)

**What it contains:**
- A large, centered input area — the dominant element on screen
- Three input modes, switchable without leaving the screen:
  - **Type** — free text
  - **Voice** — tap to record, transcribed in real time
  - **Drop** — paste or drag an image, screenshot, or file
- Below the input: a live preview of what the AI is classifying, as the user types/speaks
- After submission: a confirmation card appears showing the AI's decision:
  - Bucket (Act or Remember)
  - If Act: suggested time chip (pre-selected, changeable inline)
  - A one-line plain-language explanation: *"Treated as a task — linked to your Thursday manager meeting"*
  - Thumbs up / thumbs down for feedback
- After confirming: the screen offers "Add another" or auto-returns to Today after 3 seconds

**Key principle:** The Capture screen is a moment, not a workspace. It should feel like speaking to someone who listens and handles it. Fast in, fast out.

---

## Supporting Screens (not v1, design-ready)

| Screen | Purpose |
|---|---|
| **Remember Search** | Semantic search across all stored Remember items |
| **Someday Backlog** | Act items with no date; AI-sortable by estimated priority |
| **Settings / Profile** | AI profile, calendar connection, notification preferences |

---

## Functional Requirements

### FR-01 — Universal Capture Input
**Priority:** Must-have

Accepts: free-form text, voice (transcribed), pasted images, dropped files (PDF, documents).
Accessible from Capture screen and via global keyboard shortcut system-wide.
Submitting requires zero fields filled beyond the raw input itself.

---

### FR-02 — AI Classification Engine
**Priority:** Must-have

On every submission, the AI determines:
1. **Bucket:** Remember or Act
2. **If Act:** suggested time chip
3. **Linked items:** does this relate to something that already exists? (calendar event, prior item)
4. **Title:** a clean ≤8-word label generated from raw input

Must be correctable. Every correction trains the AI's user profile.
Must explain its decision in plain language on request.

---

### FR-03 — Today Screen
**Priority:** Must-have

See Screen 1 spec above. Additional requirements:
- Items load instantly on app open (local-first)
- Overdue items visually distinct but not alarming (heavier weight, not red)
- Calendar events woven into the timeline, not separated
- Max visible items before collapse: 7
- Completion interaction: animated dissolve + counter tick, not a simple checkbox disappear

---

### FR-04 — Capture Screen
**Priority:** Must-have

See Screen 2 spec above. Additional requirements:
- AI classification preview appears within 1.5 seconds of submission
- Voice transcription shows live as user speaks (streaming)
- After confirmation, item is immediately visible in Today if relevant to today

---

### FR-05 — Remember Storage & Search
**Priority:** Must-have (search); Nice-to-have (dedicated screen in v1)

All Remember items stored locally with full original content + AI-generated title.
Semantic search: user can query in natural language ("find the thing about async JS").
No manual organization required — AI clusters silently.

---

### FR-06 — Calendar Integration
**Priority:** Must-have

Connect to macOS Calendar (EventKit) or Google Calendar via OAuth.
- Pulls events for the next 14 days on app open and every 30 minutes
- Events shown in Today view chronologically, inline with Act items
- AI automatically generates prep Act items for qualifying events (meetings with named people, interviews, recurring syncs)
- Default prep timing: 2 hours before the event
- Prep timing configurable per event type in Settings

---

### FR-07 — AI Profile & Feedback Loop
**Priority:** Must-have

AI maintains a local user profile (structured JSON), updated continuously:
- Inferred from behavior: correction patterns, completion times, snoze/reschedule habits
- Supplemented by optional onboarding: work hours, key people, recurring contexts

Feedback surfaces:
- Thumbs up/down on every classification result
- Inline correction of bucket, time, or title
- Corrections immediately update the profile and adjust future classifications

---

### FR-08 — macOS Widget
**Priority:** Must-have

Small widget (2×2): top 3 today's Act items + next calendar event + quick-add button.
Medium widget (4×2): adds next 2–3 upcoming Act items.

---

### FR-09 — Notifications
**Priority:** Must-have

- Act item reminders (user-configurable lead time per item)
- Auto-generated prep nudges from calendar events
- Optional morning briefing notification (opt-in, configurable time)
- Notification actions: **Done** · **Snooze 1hr** · **Open app**

---

## Non-Functional Requirements

| ID | Requirement | Notes |
|---|---|---|
| NFR-01 | App cold start < 2 seconds | Electron, macOS |
| NFR-02 | AI classification response < 1.5 seconds | Optimistic UI shown immediately |
| NFR-03 | Offline capture always works | AI processes on reconnect |
| NFR-04 | All data stored locally | SQLite; no mandatory cloud sync in v1 |
| NFR-05 | Global keyboard shortcut | Opens Capture from any macOS app |
| NFR-06 | Accessibility | WCAG AA; color never sole differentiator; reduced-motion respected |

---

## Technical Approach

**Stack:**
- **Runtime:** Electron (Node.js + Chromium)
- **Frontend:** React + CSS modules (or Tailwind)
- **AI:** Anthropic Claude API — classification, summarization, profile reasoning
- **Voice:** Whisper API or macOS Speech framework (on-device)
- **Calendar:** EventKit via Electron IPC bridge, or Google Calendar OAuth
- **Storage:** SQLite via `better-sqlite3`
- **IDE:** Cursor

**AI Pipeline:**
```
[Raw Input]
  → Type detection (text / voice / image / file)
  → Transcription if voice (Whisper)
  → Classification prompt:
      - User profile context (JSON)
      - Calendar context (next 14 days)
      - Existing linked items
  → Output: bucket, time, title, links, explanation
  → Stored locally
  → Feedback captured → profile updated
```

The profile is injected into every API call as system context. It grows richer over time. The AI never asks the user to configure it manually beyond the optional onboarding.

---

## Risks & Open Questions

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI misclassification frustrates ADHD user | Medium | High | Fast inline correction; feedback loop; optimistic UI |
| Electron performance on older Macs | Low | Medium | Lazy-load non-Today views; minimize main thread work |
| Calendar permission friction (macOS) | Medium | Medium | Clear onboarding; graceful degradation without it |
| Scope creep during learning process | High | Medium | Hard lock on v1 screens; GitHub issues for v2 ideas |
| Voice transcription latency | Medium | Low | Streaming transcription; non-blocking UI |

**Open questions:**
- Should Remember items ever surface proactively, or only on explicit search?
- Onboarding: guided questionnaire or pure learn-from-behavior?
- Does the app have a name? ("Focus" is a placeholder)

---

## Success Metrics

| Metric | Target |
|---|---|
| Capture-to-classified time | < 1.5 seconds |
| AI classification accuracy (user-rated) | > 80% after 2 weeks |
| Daily open rate | App opened every day for 2+ weeks |
| Correction rate trend | Decreasing week-over-week |
| Someday → scheduled conversion | > 30% of Someday items eventually get a date |

---
---

# UI/UX Specification

## The Core Idea

Most life management apps show you a list of things you owe the world. That creates anxiety. Focus should feel like the opposite: **the app carries the weight. You just show up.**

The UI is not a dashboard. It is not a productivity tool. It is a calm, intelligent companion that knows what's going on and handles the rest.

Every design decision must answer: *does this reduce cognitive load, or increase it?*

---

## Aesthetic Direction

**This app must not look like any existing productivity tool.**

Reference points for inspiration (not imitation):
- **Arc browser** — software with a strong point of view about how you live
- **Cron / Vimcal** — a calendar that feels alive, not bureaucratic
- **Daylio** — emotional relationship with your day, not just data

**The feeling to design toward:**
A thoughtful person's physical journal — warm, slightly tactile, personal — but with an intelligence underneath it that makes it feel almost magic.

**Tone:** Warm editorial. Not cold SaaS. Not dark hacker. Not pastel wellness.

---

## Visual Language

### Typography
- **Primary display font:** An expressive, characterful serif or semi-serif. Suggestions: `Canela`, `GT Alpina`, `Freight Display`, `Playfair Display`. Use it for the date header and section titles.
- **Body / items:** Clean, readable geometric sans. Suggestions: `Geist`, `DM Sans`, `Sora`. NOT Inter, NOT SF Pro, NOT Roboto.
- **Metadata:** Same sans, light weight, muted — smaller, never competing with item titles
- Items should feel like **written words on a surface**, not form fields in a UI

### Color
Commit fully to one of these two palettes — do not mix:

**Option A — Warm Light**
| Role | Value |
|---|---|
| Background | Warm parchment `#F6F1EB` |
| Surface | `#FFFFFF` with a very soft shadow |
| Act — Today/Urgent | Warm terracotta / burnt amber `#C4622D` |
| Act — Upcoming | Faded sage `#7A9E87` |
| Calendar events | Deep ink `#2C2C3A` — feels external, not owned |
| Remember (when visible) | Soft slate blue `#6B7FA3` |
| Completed | Strike-through + 35% opacity fade |
| Accent / interactions | Warm gold `#D4A847` |

**Option B — Deep Dark**
| Role | Value |
|---|---|
| Background | Deep charcoal `#18181B` |
| Surface | `#232328` |
| Act — Today/Urgent | Warm coral `#E8674A` |
| Act — Upcoming | Muted teal `#4AADA8` |
| Calendar events | Soft silver `#A0A0B2` |
| Remember (when visible) | Dusty violet `#9B8EC4` |
| Completed | Strike-through + 30% opacity |
| Accent | Warm amber `#F0B429` |

Avoid: red for urgency, purple gradients on white, blue as the primary action color.

### Differentiation Between Item Types
Do NOT use colored card backgrounds to differentiate items. Instead use:
- **Typographic weight:** Act items are heavier, Remember items are lighter and more italic
- **Left border or dot:** a 2px colored left accent bar, not a full card fill
- **Size:** today's urgent items are slightly larger text than upcoming items

This makes the screen feel like a curated page, not a color-coded spreadsheet.

---

## Screen 1 — Today: Layout & Behavior

### Layout
```
┌─────────────────────────────────────────────┐
│  Sunday, May 25          3 done today  ✦    │  ← Date + day counter, top left. Minimal.
├─────────────────────────────────────────────┤
│                                             │
│  NOW                                        │  ← Section label: expressive serif, large
│                                             │
│  │ Call back Dana                      ↗   │  ← Act item. Left bar = urgency color.
│  │ Overdue · was yesterday                  │    Right icon = expand
│                                             │
│  │ Prep for manager 1:1               ↗   │
│  │ Today · linked to 3:00 PM meeting        │
│                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │  ← Soft divider, not a header
│                                             │
│  3:00 PM  ·  Manager 1:1              📅   │  ← Calendar event, woven into timeline
│                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                             │
│  COMING UP                                  │  ← Lower visual weight than NOW
│                                             │
│    Review PR from Tal        Tomorrow  →   │  ← Smaller, lighter
│    Fix kitchen light         Next Sun  →   │
│                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                             │
│    [show 2 more items]                      │  ← Collapsed overflow
│                                             │
└─────────────────────────────────────────────┘
      ╰──────── [  +  ] ────────╯              ← Floating capture button, bottom center
```

### Rules
- The date header is large and expressive — it anchors the user in time
- "NOW" section: max 3 items visible, then "show more"
- "COMING UP": max 4 items, progressively smaller/lighter as further out
- Calendar events woven into the list chronologically, NOT in a separate block
- No card borders — items feel like lines on a page, not chips in a UI
- The floating `+` button is the only persistent nav element — always visible

### Completion Interaction
When an item is checked:
- A warm fill sweeps across the left border bar (150ms)
- Title gets a strike-through with a slight hand-drawn feeling
- Item dissolves upward and fades out (400ms) — not a snap disappear
- The counter at the top (`3 done today ✦`) increments with a small bounce
- The next item below slides up smoothly

This moment must feel like relief, not deletion.

### Item Expansion (tap/click)
Expands inline, no new screen:
```
│ Prep for manager 1:1                        │
│ Today · linked to 3:00 PM meeting           │
│ ─────────────────────────────────────────   │
│ Original: "need to prepare for the 1on1     │
│  with my manager on thursday"               │
│ AI: Scheduled for today at 1pm (2hr before) │
│                                             │
│ [Reschedule]  [Move to Remember]  [Delete]  │
│ [👍]  [👎]                                  │
└─────────────────────────────────────────────┘
```

---

## Screen 2 — Capture: Layout & Behavior

### Layout
```
┌─────────────────────────────────────────────┐
│  ←  (back to Today)                         │
│                                             │
│                                             │
│                                             │
│         What's on your mind?               │  ← Large, centered prompt. Serif. Soft.
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │  Type here, or drop anything in...   │  │  ← Large text area. No border stress.
│  │                                       │  │     Fills most of the screen.
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│    [🎙 Voice]          [📎 Drop / Paste]    │  ← Input mode toggles. Subtle.
│                                             │
│                                             │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                             │
│  ⟳ Classifying...                          │  ← Appears after submit. Soft animation.
│                                             │
│  ✦ Act · Today                             │  ← AI result card. Appears in ~1.5 sec.
│    Prep for manager 1:1                     │
│    Linked to Thursday 3pm meeting           │
│                                             │
│    [ Today ] [ Tomorrow ] [ Someday ] ...   │  ← Chips. AI pre-selects. User can change.
│                                             │
│    [👍 Looks right]    [👎 Change this]     │
│                                             │
│    ── or ──  [ Add another ]                │
│                                             │
└─────────────────────────────────────────────┘
```

### Rules
- The input area is the dominant element — it should take up ~50% of the screen
- The prompt ("What's on your mind?") feels like a person asking, not a UI label
- Voice mode: tap to record, waveform visualized in real time, transcription streams below
- Drop mode: the entire screen becomes a drop target — items land with a satisfying snap
- After classification: the result card slides up from below — never a modal or overlay
- Chips are scrollable horizontally, AI suggestion is pre-selected with accent fill
- After thumbs up (or 3-second inactivity): auto-return to Today with a smooth transition
- "Add another" resets the input and keeps the user in Capture

---

## Scheduling Chips

```
[ Today ]  [ Tomorrow ]  [ In a few days ]  [ Next Sun ]  [ Next week ]  [ Someday ]  [ Pick date ]
```

- Pill-shaped, horizontally scrollable
- AI pre-selects: filled accent color
- Unselected: ghost/outline style
- Tapping any chip immediately updates — no confirm button needed

---

## Empty States

Never a blank screen. Empty states are copy-forward, not icon-forward.

| State | Copy |
|---|---|
| No Act items today | *"Nothing due today. Rare and good. Something on your mind?"* |
| Capture just submitted, all clear | *"Got it. I'll handle the rest."* |
| Someday backlog empty | *"Your backlog is clear. That's rarer than you think."* |

No generic empty-state illustrations. Typography only, or a single minimal mark.

---

## macOS Widget

**Small (2×2):**
```
┌─────────────────────┐
│  Sunday              │
│                      │
│  · Call back Dana    │
│  · Prep for 1:1      │
│  · Review PR Tal     │
│                      │
│              [ + ]   │
└─────────────────────┘
```

**Medium (4×2):** adds next calendar event and 2 more items. Same visual language as the app.

---

## Notifications

- macOS native style
- Title: ≤6 words (AI-generated item title)
- Subtitle: context line (*"Prep for your 3pm meeting"*)
- Actions: **Done** · **Snooze 1hr** · **Open**
- Morning briefing: single grouped notification, not individual pings
- Never more than 3 notifications at once — batch if needed

---

## Accessibility

- All interactive elements keyboard-navigable
- Focus ring visible, styled to match the app's accent color (not browser default)
- Color never the sole differentiator — always paired with weight, position, or icon
- `prefers-reduced-motion`: all dissolve/slide animations replaced with instant crossfades

---

## Hard Rules for the Design Tool

| ❌ Never | ✅ Instead |
|---|---|
| Colored card backgrounds to differentiate items | Left accent bar + typographic weight |
| Red for urgency | Warm terracotta / amber |
| Modals for any action | Inline expansion only |
| Small grey text on grey backgrounds | High contrast metadata |
| Inter, Roboto, SF Pro as primary font | Characterful serif + clean geometric sans |
| Generic empty states (icon + "No items found") | Warm, human, copy-only treatment |
| Checkbox-only completion | Animated dissolve + counter feedback |
| More than 7 items visible at once | Collapse with "show more" |
| Separate section block for calendar events | Woven into the timeline chronologically |
| A screen that looks like any existing to-do app | Something that feels built for one specific person |

---

**Audience:** Mixed (product owner + AI design tool handoff) | **Type:** PRD + UI/UX Spec | **Version:** 0.2