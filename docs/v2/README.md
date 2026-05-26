# Needle v2 Architecture

This folder is the architectural source of truth for the next model iteration.

Read in order:

1. `product-direction.md` - product north star for AI-guided daily flow.
2. `architecture-guidelines.md` - engineering guardrails for platform, repo, sync, and growth.
3. `current-model-audit.md` - why the current UI-shaped model is not enough.
4. `domain-model.md` - product/domain concepts.
5. `data-model.md` - persistence shape for SQLite/Postgres.
6. `sync-and-web.md` - desktop/web/server/sync direction.
7. `sync-access-observability.md` - sync, permissions, notifications, metrics, and logs.
8. `multi-app-roadmap.md` - staged path from macOS MVP to web, mobile, server, and coach surfaces.
9. `research-notes.md` - external sources checked and conclusions to revisit.
10. `implementation-roadmap.md` - near-term migration path from the current app.

Related artifacts:

- `src/shared/domain-v2.ts` - target shared TypeScript contract.
- `.cursor/skills/needle-domain-architecture/SKILL.md` - workflow for future domain changes.
- `docs/superpowers/specs/2026-05-26-v2-domain-architecture.md` - Superpowers-style spec for this branch.

## Recent direction update — 2026-05-26

An `/office-hours` session reframed the product wedge. PRD v1 ("Remember/Act capture") is paused; PRD v2 + torch is promoted to the v1 wedge under a new product noun: **"hard stop."** Calendar meetings are one trigger; lunch, on-track check-ins, and manual `⌘⇧K` are others. Read the decision before continuing v2 design work:

- `../office-hours/2026-05-26-hard-stop-coach-wedge.md` — the approved wedge.
- `../office-hours/SESSIONS.md` — narrative arc + premise revisions.
- `../office-hours/README.md` — how the `/office-hours` skill works.

The v2 architecture in this folder is still correct, but its priority order changes: `Intervention`, `Ritual`, `CaptureEntry`, and `Item.commitmentLevel` are now wedge-critical. `Item.bucket`, the Today screen, and the `Remember` flow are deferred until the wedge has 5 paying users.
