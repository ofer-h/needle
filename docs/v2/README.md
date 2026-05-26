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
