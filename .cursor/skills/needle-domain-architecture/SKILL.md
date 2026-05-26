---
name: needle-domain-architecture
description: Use when changing Needle's core product model, persistence model, sync model, multi-user collaboration, sharing, actors, subtasks-as-items, or web-compatible architecture. Produces durable docs and shared TypeScript domain contracts before app-code refactors.
---

# Needle Domain Architecture

This skill protects Needle's core model from UI-driven drift. Use it before changing `src/shared/types.ts`, persistence tables, sync behavior, task/subtask semantics, sharing, or actor/coach/accountability concepts.

## When to use

Triggers:
- "domain model", "data model", "DB schema", "SQLite", "Postgres", "web support"
- "subtasks first class", "shared tasks", "multiple users", "permissions"
- "AI coach", "accountability partner", "actor", "agent"
- Any change that would make local UI state become persistent product state

## Process

1. Read `docs/v2/current-model-audit.md`.
2. Read `docs/v2/architecture-guidelines.md`.
3. Read `docs/v2/domain-model.md`.
4. Read `docs/v2/data-model.md`.
5. Read `docs/v2/sync-access-observability.md` if the request touches sync, permissions, notifications, metrics, logs, or coach/accountability access.
6. Check `src/shared/domain-v2.ts` for the target contract.
7. Decide whether the request is:
   - **Domain decision**: update docs + memory first.
   - **Schema work**: update `docs/v2/data-model.md` before adding migrations.
   - **App refactor**: preserve current UI while moving state toward `domain-v2`.

## Non-negotiables

- Subtasks are first-class `Item`s connected by `item_relations.relation_type = 'contains'`.
- `User` means a human account. `Actor` means anything that can create, modify, coach, or sync: user, AI agent, coach, accountability partner, integration, or system.
- Scheduling is not stored directly on the item. Use plans/occurrences so shared items can appear differently for different users.
- UI display fields such as `dateLabel`, `datePill`, `isOverdue`, and Today grouping are derived view state, not canonical persistence fields.
- Every workspace-scoped product record carries workspace scope and audit timestamps.
- Do not move to the monorepo shape until a second app/server/package makes it useful.
- Notifications, usage metrics, logs, and coach/accountability access must preserve user trust and actor attribution.

## Verification

- The change explains how it maps to `domain-v2`.
- The schema supports desktop local-first and web/server storage.
- Multi-user ownership, assignment, sharing, and actor attribution are preserved.
- `memory/decisions.md` records who drove the architecture decision.
