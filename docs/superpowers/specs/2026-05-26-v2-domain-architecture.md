# Needle v2 Domain Architecture

**Date:** 2026-05-26
**Branch:** `codex-v2-architecture`
**Driven by:** Ofer
**Status:** Draft architecture foundation

## Goal

Move Needle from a UI-shaped task model to a durable product model that can support:

- AI-guided daily flow and current-focus state.
- Intentional task transitions and lightweight reflections.
- Desktop and web clients.
- Local-first persistence on desktop.
- Server-backed sync for web and collaboration.
- Multiple users in shared workspaces.
- Shared tasks with per-user planning and assignment.
- AI coaches, accountability partners, calendar sync, and other non-human actors.
- Subtasks as first-class items, not embedded checklist data.

## Core decision

Subtasks are not a separate lightweight type. A subtask is an `Item` connected to another `Item` through a `contains` relation.

This keeps one model for:

- Titles, notes, status, scheduling, ownership, source, comments, audit history.
- Assignments and per-user completion.
- Sharing and permissions.
- AI generation and coaching activity.

Product language can keep saying "subtask." Architecture should say "child item."

Daily flow is also first-class. The app is not only an item database: it must model focus sessions, transitions, reflections, suggestions, and behavioral insights so AI can guide without becoming noisy or controlling.

## Artifact map

- `docs/v2/current-model-audit.md` - audit of the current UI-shaped model.
- `docs/v2/product-direction.md` - AI-guided daily flow product north star.
- `docs/v2/domain-model.md` - domain concepts and boundaries.
- `docs/v2/data-model.md` - database-oriented schema plan.
- `docs/v2/sync-and-web.md` - web/local-first/sync architecture.
- `docs/v2/implementation-roadmap.md` - migration path from current app state.
- `src/shared/domain-v2.ts` - target shared TypeScript contract.
- `.cursor/skills/needle-domain-architecture/SKILL.md` - reusable workflow for future agents.

## Non-goals

- Do not immediately replace the current running UI.
- Do not introduce a database dependency in this branch.
- Do not choose the final sync backend vendor yet.
- Do not build a permissions UI yet.

## Success criteria

- Future app work can model subtasks, notes, events, relations, plans, comments, actors, and assignments without reworking the model.
- The same domain contract can be used by Electron, web, and server code.
- The first SQLite/Postgres schema can be derived from the docs without inventing new concepts.
