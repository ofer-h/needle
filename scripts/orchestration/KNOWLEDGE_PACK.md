# Needle Agent Knowledge Pack
# Read this entire file before touching any code.

## What this project is
Needle (product name: Focus) is a macOS Electron app for a software engineer with ADHD.
It is an intelligent second brain: capture anything, AI classifies it, surfaces the right things at the right time.
Stack: Electron 42 + Forge + Vite + React + TypeScript + Zustand + Global CSS custom properties.

## Who you are working for
Ofer Hashimshony — primary engineer, product owner. Git: groot@Ofers-MacBook-Pro.local.
Do NOT add nodeIntegration: true or contextIsolation: false. Ever.
All IPC goes through typed contracts in src/shared/ipc-contracts.ts.

## Current branch strategy
You are on your own agent branch (see your task file for the branch name).
NEVER commit directly to master or codex-v2-architecture.
Commit early and often with clear messages prefixed: "agent/<your-branch>: <what>"

## Non-negotiables
- Run `npm run typecheck` after every significant change. Fix all errors before proceeding.
- Run `npm run lint` after every significant change. Fix all errors before proceeding.
- Never use inline styles. All styling goes through CSS custom properties from tokens.css / primitives.css.
- Never import raw hex colors. Use semantic tokens: --surface-*, --ink-*, --accent-*, --border-*.
- Dark mode must work. All components must respect [data-theme="dark"].
- No Tailwind. No CSS-in-JS. No vanilla-extract.

## Key file locations
- Main entry: src/main/index.ts
- Renderer root: src/renderer/main.tsx
- Shared types + IPC: src/shared/types.ts + src/shared/ipc-contracts.ts
- V2 domain model: src/shared/domain-v2.ts
- Styles: src/renderer/styles/tokens.css + primitives.css + global.css
- Design docs: design/llms.txt (READ THIS for any UI work)
- Memory: memory/context.md + memory/decisions.md
- Forward plan: docs/needle-forward-implementation-plan.md
- V2 roadmap: docs/v2/implementation-roadmap.md
- V2 domain docs: docs/v2/domain-model.md + docs/v2/data-model.md

## Design system quick reference
Token layers (3-layer architecture):
  1. primitives.css — raw values (--sand-*, --ink-*, --space-*, --radius-*, --text-*, etc.)
  2. tokens.css — semantic aliases (--surface-base, --surface-raised, --ink-1, --ink-2, --ink-3, --accent-primary, etc.)
  3. Components consume semantic tokens only — never primitives directly.

Primitives library (src/renderer/components/primitives/):
  Button, Checkbox, Divider, Icon, IconButton, Kbd, Pill, ProgressBar
  All classes namespaced ds-*.

## Reporting
At the END of your work, write a report to: scripts/orchestration/reports/<your-branch-name>.md
Report format:
  ## Summary
  ## Files changed (list each file + one line what changed)
  ## Typecheck result
  ## Lint result
  ## Decisions made
  ## What's left / known gaps
  ## Blockers (if any)

## Step logging
As you work, append to: scripts/orchestration/logs/<your-branch-name>.log
Format: [HH:MM] <what you just did>
This is how the orchestrator tracks your progress.
