---
name: needle-debug-app-state
description: >-
  Debug stuck or broken Needle UI when the user reports infinite loading, empty
  Today, classify/save failures, or "nothing happened". Step-by-step playbook
  using BuildDiagnostics, terminal logs, uiLog, SQLite userData, and API key reset.
---

# Needle debug app state

Systematic triage when the product looks wrong but the cause is unclear.

## When to use

- "Classifying forever", "Saving… stuck", empty Today after restart
- Capture works once then fails; API key confusion (.env vs UI)
- Any report that contradicts expected async UX (`docs/async-ux.md`)

## Read first

1. `docs/decisions/2026-05-27-async-ux-and-observability.md` — what should work today vs known gaps
2. `docs/observability.md` — stuck-user playbook
3. `docs/async-ux.md` — timeouts and expected UI behavior
4. `.cursor/rules/observability.mdc`, `.cursor/rules/async-ux.mdc`

## Step-by-step

### 1. Verify build (renderer)

- Dev only: bottom-left **BuildDiagnostics** — `v*`, git SHA, `key: .env` | `userData` | `missing`.
- If `key: missing` → classify will fail fast with key error, not hang.
- After one classify attempt: `classify ok Nms` or `classify error Nms` on the strip.

```ts
// DevTools console
await window.api.app.getDiagnostics()
await window.api.app.getFlowHealth()
```

### 2. Main terminal

Run or inspect the terminal where `npm start` is active. Search `[needle]`:

| Pattern | Meaning |
|---------|---------|
| `[flow] classify start` without matching `end` | Main still in flight or hung before timeout |
| `classify failed` + `error` | Network, key, rate limit — UI should show message within 30s |
| `classify skipped — no API key` | No env/config key |
| `ai:setApiKey` | Key save path |

Note `flowId` on start/end pairs.

### 3. Renderer DevTools

Filter `[needle-ui]`:

- `[capture] classify …` should align with Capture UI state.
- Missing end log → renderer timeout, cancel, or stale generation.

### 4. SQLite + userData (macOS)

| Path | Use |
|------|-----|
| `~/Library/Application Support/Needle/needle.db` | Tasks, events, capture entries |
| `~/Library/Application Support/Needle/config.json` | `anthropicApiKey` from UI |

- Empty Today after restart: confirm hydrate ran (`App` mount) and DB has rows (not only Zustand mocks).
- Dev `.env` overrides config key when `envFileLoaded` is true on diagnostics.

### 5. Reset API key

1. Remove `anthropicApiKey` from `config.json` **or** clear field in Capture API key UI.
2. For dev: set `ANTHROPIC_API_KEY` in repo-root `.env` (see `.env.example`) and restart `npm start`.
3. Re-check BuildDiagnostics: `key: .env` or `key: userData`.

### 6. Common fixes

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| Classify dots forever | No timeout / swallowed error | Ensure `usePendingOperation` + main `CLASSIFY_TIMEOUT_MS`; check terminal for `classify end` |
| Error within 30s but vague | API / parse failure | Read `error` in flow health + terminal; fix key or network |
| Empty Today | Hydrate not run or empty DB | `hydrateFromDb`, verify `needle.db` has tasks |
| Saving API key forever | Missing `finally` / no timeout | `ApiKeySettings` + `usePendingOperation` (10s) |
| Works in dev, not packaged | `.env` not loaded | Use UI key or OS env; packaged skips dotenv |
| UI vs terminal mismatch | Stale IPC generation | Cancel and retry; check `flowId` |

### 7. Escalate

If logs show success but UI shows error (or vice versa), compare `flowId` and timestamps, then inspect the specific component (`CaptureScreen`, store hydrate) before changing architecture.

## Must not

- Log or paste API keys into issues or chat.
- Delete `needle.db` without user consent (data loss).

## Related skills

- **`needle-async-ux`** — fix infinite pending implementation
- **`needle-observability`** — add missing instrumentation
