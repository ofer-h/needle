# Observability — logging, flow health, and debug playbooks

Reference for how Needle records what happened during async flows, how to debug “stuck” UI, and what we may add later (Sentry, analytics). Pairs with async UX (`docs/async-ux.md`).

**Decision record (why, file index, backlog):** [docs/decisions/2026-05-27-async-ux-and-observability.md](./decisions/2026-05-27-async-ux-and-observability.md)

Agents should also read:

- `.cursor/rules/observability.mdc` — enforceable checklist
- `.cursor/skills/needle-observability/SKILL.md` — instrument + verify
- `.cursor/skills/needle-debug-app-state/SKILL.md` — user-reported stuck/broken UI

---

## Logging scopes

| Prefix | Where | When | Audience |
|--------|--------|------|----------|
| `[needle]` | Main process (`needleLog` in `src/main/log.ts`) | Dev only (`!app.isPackaged`) | Terminal running `npm start` |
| `[needle-ui]` | Renderer (`uiLog` in `src/renderer/utils/ui-log.ts`) | Always (DevTools console) | Manual QA, agents with browser tools |

**Scope** is the bracket after the prefix, e.g. `[needle] [ai] classify ok`, `[needle-ui] [capture] classify start`.

### Conventions

- **Start / end** — Log when a user-visible flow begins and when it finishes (success, error, or cancel).
- **Duration** — Include `ms` on end events.
- **Safe meta** — `textLen`, `bucket`, `keySource`, `flowId`, `error` message strings. Never log API keys, full capture text, or env file contents.
- **IPC** — Handlers log invalid payloads and high-level outcomes (`needleLog('ipc', …)`).

---

## Flow events and `flowId`

Multi-step or long-running flows should share a **`flowId`** (UUID from `mintFlowId()` in main) across related log lines and flow-health events.

| Piece | Path |
|-------|------|
| Types | `src/shared/flow-health.ts` |
| Ring buffer (last 50) | `src/main/services/flow-health.ts` |
| IPC | `app:getFlowHealth` → `window.api.app.getFlowHealth()` |
| Example instrumented flow | `src/main/ai/classify.ts` |

`recordFlowEvent` writes to the in-memory buffer and mirrors to `[needle] [flow] …` in the terminal.

**Renderer** should log the same `flowId` in `uiLog` when the UI initiates a flow (pass from IPC response or mint in renderer only for UI-only steps — prefer main as source of truth for classify).

---

## Dev vs production

| Capability | Dev (`npm start`) | Packaged |
|------------|-------------------|----------|
| `needleLog` | Yes | No (silent) |
| `uiLog` | DevTools | DevTools if user opens it |
| `BuildDiagnostics` | Bottom-left version / key / classify summary | Hidden flow-health strip; diagnostics IPC still available |
| `app:getFlowHealth` | Yes | Yes (in-memory only; resets on quit) |
| Repo `.env` | Loaded via `load-env` | Not loaded |

Do not rely on logs in production for user support until we add opt-in crash reporting.

---

## Privacy

- **Never** log `ANTHROPIC_API_KEY`, `config.json` contents, or raw user capture/brain-dump text.
- Log **lengths** and **outcomes** (`textLen`, `bucket`, `error` string from safe mapping).
- Flow-health `meta` must follow the same rules.

---

## Future phases (optional, not required per PR)

1. **Flow health persistence** — Rolling counters in SQLite or userData JSON (classify success rate, p95 `ms`).
2. **Sentry** — Opt-in main + renderer for uncaught errors and IPC failures; scrub secrets in `beforeSend`.
3. **Product analytics** — Local-only aggregates first; cloud only with explicit consent.

---

## Manual playbook: “user said stuck”

Work top-down; correlate main terminal, DevTools, and on-screen diagnostics.

### 1. On-screen build strip (dev)

- Bottom-left **BuildDiagnostics**: `v*`, git SHA, `key: .env` / `userData` / `missing`, optional `classify ok 1234ms` or `classify error …`.
- If classify line missing, no classify has completed this session yet.

### 2. Main terminal (`npm start`)

Look for:

```
[needle] [flow] classify start { flowId, textLen, keySource }
[needle] [flow] classify end { flowId, ms, outcome, bucket | error }
[needle] [ai] classify ok | classify failed …
```

Stuck UI with no `classify end` → main still waiting or renderer timeout mismatch; check network and `CLASSIFY_TIMEOUT_MS` (30s).

### 3. Renderer DevTools

Filter console for `[needle-ui]`. Capture should show `classify start` → success/error within 30s. Mismatch with terminal → IPC or stale generation (`usePendingOperation`).

### 4. Build / code strip

- Confirm git SHA on strip matches expected branch.
- `npm run typecheck && npm run lint` if behavior changed after local edits.

### 5. userData paths (macOS)

| File | Purpose |
|------|---------|
| `~/Library/Application Support/Needle/needle.db` | SQLite tasks/events/capture |
| `~/Library/Application Support/Needle/config.json` | UI-saved API key (`anthropicApiKey`) |

Reset API key: delete `anthropicApiKey` from `config.json` or use Capture API key UI; env key overrides when `.env` is loaded in dev.

### 6. Flow health IPC (dev tools / console)

In DevTools: `await window.api.app.getFlowHealth()` — inspect `lastClassify` and recent `events`.

---

## Related primitives

| Concern | Doc / code |
|---------|------------|
| No infinite pending | `docs/async-ux.md`, `usePendingOperation` |
| App build + key source | `app:getDiagnostics`, `BuildDiagnostics` |
| Async UX agent skill | `.cursor/skills/needle-async-ux/` |
