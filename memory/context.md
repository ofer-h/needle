# Project Context

## Who is working on this

### Ofer Hashimshony
- Role: primary engineer, product owner, primary AI user
- Focus: implementation, architecture, day-to-day coding
- Git: `groot@Ofers-MacBook-Pro.local` / committer name "Ofer Hashimshony"

### Omri
- Role: co-owner, product direction
- Focus: product decisions, PRD, design direction

**How to identify who is in the session:**
Check `git config user.name` or the machine hostname. If it's Ofer's Mac, address Ofer.
If unclear, ask at the start: "Is this Ofer or Omri?"
Always note in `decisions.md` who drove each decision.

---

## What
Focus — macOS desktop app for a software engineer with ADHD.
Intelligent second brain: capture anything, AI classifies it, surfaces the right things at the right time.

## Current state (as of 2026-05-24)
- Full Electron app scaffolded and running (`npm start`).
- Today screen and Capture screen implemented with mock data.
- No backend, no AI, no DB yet — pure UI shell.

## Key paths
- Design source: `/Users/groot/Downloads/Needle/` (local only, do not commit)
- Main entry: `src/main/index.ts`
- Renderer root: `src/renderer/main.tsx`
- Shared types + IPC contracts: `src/shared/`
- Styles: `src/renderer/styles/tokens.css` + `global.css`

## Non-negotiables
- Never add `nodeIntegration: true` or `contextIsolation: false`.
- All IPC goes through the typed contracts in `src/shared/ipc-contracts.ts`.
- v1 scope is Today + Capture only. Do not expand without Ofer + Omri alignment.
