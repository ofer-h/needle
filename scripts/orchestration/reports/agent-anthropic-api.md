## Summary

**Status: done** — Anthropic capture classification wired on `agent/anthropic-api`.

Main-process `classify()` via `@anthropic-ai/sdk` (Haiku), API key from `ANTHROPIC_API_KEY` or `userData/config.json`, IPC `ai:*`, preload bridge, Capture UI with classifying/result/error states and API key modal.

## API key setup (for Ofer)

1. **Environment:** `export ANTHROPIC_API_KEY=sk-ant-…` before `npm start` (preferred for dev).
2. **In-app:** Capture footer → **API key** → paste → **Save key** → `~/Library/Application Support/focus/config.json` as `{ "anthropicApiKey": "…" }`.

Keys are never logged. Model: `claude-haiku-4-5-20251001`.

## Verification

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npm run lint` (Agent D files) | No new issues |
| `npm run lint` (full) | 2 pre-existing errors elsewhere |
| Live API test | Skipped (no key in env) |

## Files

- `package.json`, `package-lock.json` — `@anthropic-ai/sdk`
- `src/shared/types.ts`, `src/shared/ipc-contracts.ts`
- `src/main/ai/config.ts`, `src/main/ai/classify.ts`
- `src/main/ipc/ai-handlers.ts`, `src/main/ipc/index.ts`
- `src/preload/index.ts`, `src/renderer/window.d.ts`
- `src/renderer/components/Capture/CaptureScreen.tsx`
- `src/renderer/components/Capture/ApiKeySettings.tsx`, `.css`

## Known gaps

- Voice path uses placeholder text until STT exists.
- Classified capture does not persist to store/DB yet.
- No mocked Anthropic unit test.
