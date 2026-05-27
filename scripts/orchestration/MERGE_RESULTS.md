# Orchestration merge results

**Integration branch:** `needle-ai-orchestration` @ `dc5fa78`  
**Merged:** 2026-05-27 (Ofer + AI orchestration)

## What landed

1. **Capture refactor (C)** — `CaptureScreen.css`, primitives, no inline styles; live Anthropic classify wired in Capture UI.
2. **v2 store adapter (A)** — `fixture-v2.ts`, `store-v2-today-adapter.ts`, selector tests, `selectors-v2.ts` updates.
3. **SQLite persistence (B)** — `better-sqlite3`, migrations, repository, `db:*` IPC, seed on launch, repository tests.
4. **Anthropic API (D)** — `@anthropic-ai/sdk`, `ai:classify` / `ai:setApiKey` / `ai:hasApiKey`, `ApiKeySettings`, classify service in main.

## Still NOT wired (intentional / follow-up)

| Gap | Detail |
|-----|--------|
| Today → v2 store | Today uses v1 store + SQLite; v2 adapter exists for optional Phase 4 dogfood. |
| Classify → task create | Capture rows land in `capture_entries`; classification does not yet create/update tasks. |
| API key in production | Packaged app skips dotenv; use env var or Capture API key UI. |

## Human actions

- **Local dev:** copy `.env.example` → `.env`, set `ANTHROPIC_API_KEY=sk-ant-…` (main loads it on `npm start`; file is gitignored).
- Or set Anthropic API key in Capture (“API key” footer) — stored in userData `config.json`; env wins if both are set.
- Run `npm install --legacy-peer-deps` after pulling (peer dep conflict between eslint 9 and `@eslint/js` 10).
- Native module: `better-sqlite3` may need rebuild after Node/Electron version changes (`npm rebuild better-sqlite3`).
- Packaging: `npm run package` fails notarization/signature in unsigned dev environments; use `npm start` for smoke tests.

## Reports

- Per-agent: `scripts/orchestration/reports/agent-*.md`
- Verification log: `scripts/orchestration/reports/merge-verification.md`
