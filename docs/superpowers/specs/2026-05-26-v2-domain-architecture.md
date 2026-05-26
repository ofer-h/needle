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
- Future Expo mobile client.
- Local-first persistence on desktop.
- Server-backed sync for web and collaboration.
- Multiple users in shared workspaces.
- Shared tasks with per-user planning and assignment.
- AI coaches, accountability partners, calendar sync, and other non-human actors.
- Scoped coach/accountability access.
- Notifications, usage metrics, logs, and diagnostics without violating privacy.
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

Platform growth is staged. Electron macOS proves the product first; then local SQLite; then shared domain packages; then NestJS/Postgres sync; then web/mobile/coach surfaces. Do not do a broad monorepo migration before a second app/server/package exists.

## Artifact map

- `docs/v2/current-model-audit.md` - audit of the current UI-shaped model.
- `docs/v2/product-direction.md` - AI-guided daily flow product north star.
- `docs/v2/architecture-guidelines.md` - platform/repo/backend/data-growth guardrails.
- `docs/v2/domain-model.md` - domain concepts and boundaries.
- `docs/v2/data-model.md` - database-oriented schema plan.
- `docs/v2/sync-and-web.md` - web/local-first/sync architecture.
- `docs/v2/sync-access-observability.md` - access control, notifications, telemetry, and logs.
- `docs/v2/multi-app-roadmap.md` - staged path to server, web, mobile, and coach surfaces.
- `docs/v2/research-notes.md` - external sources checked and decisions to revisit.
- `docs/v2/implementation-roadmap.md` - migration path from current app state.
- `src/shared/domain-v2.ts` - target shared TypeScript contract.
- `.cursor/skills/needle-domain-architecture/SKILL.md` - reusable workflow for future agents.

## Non-goals

- Do not immediately replace the current running UI.
- Do not introduce a database dependency in this branch.
- Do not choose the final sync backend vendor yet.
- Do not build a permissions UI yet.
- Do not move folders into a monorepo in this branch.

## Success criteria

- Future app work can model subtasks, notes, events, relations, plans, comments, actors, and assignments without reworking the model.
- The same domain contract can be used by Electron, web, mobile, and server code.
- The first SQLite/Postgres schema can be derived from the docs without inventing new concepts.
- Access, notifications, analytics, and sync have an explicit low-cost path from local-only to hosted growth.
