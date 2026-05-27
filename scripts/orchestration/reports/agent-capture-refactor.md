## Summary

**Status: done** (Capture UI refactor complete on `agent/capture-refactor`)

Refactored `CaptureScreen` to match Today-screen design-system quality: all layout/visual styles live in `CaptureScreen.css` using semantic tokens (`--ink-*`, `--surface-*`, `--space-*`, `--text-*`). Replaced ad-hoc buttons with `Button`, `Icon`, `Pill`, and `Divider` primitives. Zero inline styles remain in Capture components.

Classification uses a mock 1.5s delay and local `CaptureClassification` type (real AI IPC is Agent D scope on a separate branch).

## Files changed

| File | Change |
|------|--------|
| `src/renderer/components/Capture/CaptureScreen.css` | **New** — token-based `.capture-*` styles, wave bars via nth-child, reduced-motion guards |
| `src/renderer/components/Capture/CaptureScreen.tsx` | Removed all inline styles; primitives; classifying/error/done flows |
| `scripts/orchestration/logs/agent-capture-refactor.log` | Audit + progress log |

## Typecheck result

```
npx tsc -p tsconfig.renderer.json --noEmit  → PASS
npm run typecheck                           → FAIL (src/main/db/repository.ts — exactOptionalPropertyTypes, pre-existing on branch)
```

## Lint result

```
npm run lint -- src/renderer/components/Capture/  → PASS (no Capture issues)
```

Repo-wide lint still reports unrelated files (`BrainDumpPanel.tsx`, `window.d.ts`, `InterventionLayer.tsx`).

## Build result

```
npm run package  → Vite bundles PASS; macOS codesign step FAIL (sandbox/adhoc signing — not caused by this refactor)
```

No `npm run build` script in `package.json`; `electron-forge package` used instead.

## Decisions made

- Kept global `.composer` / `.result-card` / `.thinking` classes from `global.css` and scoped Capture-specific overrides under `.capture-*` rather than duplicating composer rules.
- Interactive schedule chips use `.capture-time-chip` (not `Pill`, which is non-interactive).
- Voice waveform bar heights encoded in CSS nth-child rules to avoid inline `--height` styles.
- Used mock classification on this branch so Capture refactor stays independent of Agent D IPC work.

## What's left / known gaps

- Full `npm run typecheck` blocked until `src/main/db/repository.ts` optional-field errors are fixed (Agent B territory).
- `npm run package` codesign failure is environmental; Vite compile succeeded.
- Time chips still use mock labels; not yet bound to `ClassificationResult.suggestedDate`.
- Voice state still uses placeholder transcript (no real STT).

## Blockers

None for the Capture refactor scope.
