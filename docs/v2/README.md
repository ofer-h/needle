# Needle v2 Architecture

This folder is the architectural source of truth for the next model iteration.

Read in order:

1. `product-direction.md` - product north star for AI-guided daily flow.
2. `current-model-audit.md` - why the current UI-shaped model is not enough.
3. `domain-model.md` - product/domain concepts.
4. `data-model.md` - persistence shape for SQLite/Postgres.
5. `sync-and-web.md` - desktop/web/server/sync direction.
6. `implementation-roadmap.md` - migration path from the current app.

Related artifacts:

- `src/shared/domain-v2.ts` - target shared TypeScript contract.
- `.cursor/skills/needle-domain-architecture/SKILL.md` - workflow for future domain changes.
- `docs/superpowers/specs/2026-05-26-v2-domain-architecture.md` - Superpowers-style spec for this branch.
