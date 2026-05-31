# Needle v2 Architecture

This folder is the architectural source of truth for the next model iteration.

**Product framing (read first for the *why*):**

- [`../positioning.md`](../positioning.md) — what Needle is and how to pitch it (transition coach).
- [`../competitive-landscape.md`](../competitive-landscape.md) — market position vs. timers/planners/body-doubling.

> The original v1 PRD ("second brain" / Remember-Act capture) is archived at
> [`../old/PRD.md`](../old/PRD.md) and is **no longer current direction**.

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
11. `studio-redesign.md` - the in-progress UI redesign as `@needle/ui-web` + `apps/studio` (one canonical model; templates are pure config). Living record; see also `../decisions/2026-05-31-ui-web-studio-redesign.md`.
12. `studio-handoff.md` - **continuation guide for the Studio redesign**: exact current state (Phases 0–4; typecheck green, pending final verify + commit), remaining steps, how to run, file map, gotchas. Read this first if picking the work up.
13. **`needle-next-master-plan.md`** - **the authoritative go-forward master plan**: Desktop next-level + the **Transition System**, reconciling Ofer's direction + the Cursor and Codex plans into one implement-ready, subagent-parallelizable spec. Read this before starting feature work. Raw requirements appendix: `needle-next-master-plan-DRAFT.md`.
14. `brain-dump-and-time-machine.md` - **DOC-A2**: brain-dump UX spec (Part A, buildable now) + macOS "time machine" rolling-buffer capture via ScreenCaptureKit/AVAssetWriter (Part B, future flagged track WP-B8, off by default). Covers privacy stance, Swift sidecar architecture, permissions/entitlements, and extra ideas.
15. `meeting-awareness.md` - **DOC-A5**: spec for meeting-join detection (future flagged track WP-B9, off by default). Four-signal confidence model (CoreAudio mic/cam in-use, NSWorkspace frontmost app, browser URL heuristics, Accessibility tree buttons); uses for accountability and transition-interrupt softening.

Related artifacts:

- `src/shared/domain-v2.ts` - target shared TypeScript contract.
- `.cursor/skills/needle-domain-architecture/SKILL.md` - workflow for future domain changes.
- `docs/superpowers/specs/2026-05-26-v2-domain-architecture.md` - Superpowers-style spec for this branch.
