# @needle/studio — agent guide

**Demo harness only.** All features and business logic live in `packages/ui-web`.

## Non-negotiables

- New scenarios mount real `@needle/ui-web` components — do not reimplement
  features here.
- `studio.css` is chrome only (rail, topbar, content frame). Feature styles
  belong in `ui-web`.

## Authority

- Package conventions: [`packages/ui-web/CLAUDE.md`](../../packages/ui-web/CLAUDE.md)
- Full design decisions: [`docs/v2/studio-redesign.md`](../../docs/v2/studio-redesign.md)

## Verify

```bash
pnpm --filter @needle/studio dev   # open in browser, click through scenarios, toggle light/dark
```
