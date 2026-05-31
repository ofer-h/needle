# @needle/ui-web — agent guide

Authoritative background: [`docs/v2/studio-redesign.md`](../../docs/v2/studio-redesign.md).
Enforced conventions: [`.cursor/rules/ui-web.mdc`](../../.cursor/rules/ui-web.mdc).
**Read those before editing this package.**

## Non-negotiables

- **Templates are pure presentation config.** A template is a config object.
  Switching or building a template MUST NOT mutate item data. Layout renderers
  receive `TodayItemView[]` + a `Template` and only read — this is the open/closed
  core; do not break it.
- **Reuse `@needle/domain`.** Do not invent a parallel entity that already exists
  there. New UI-driven types go in `src/model/*` with a "promote into @needle/domain
  once validated" comment.
- **`src/model/index.ts` is the one allowed barrel.** The curated public surface.
  Do not add other barrels casually.
- **Pure logic stays pure.** `src/model/*` is framework-free (no React, no I/O).
  Put a `*.test.ts` beside any new logic file.
- **Semantic tokens only.** `var(--ink)`, `var(--surface)`, `var(--urgent)` in
  components — never raw hex, never `--sand-*`/`--ink-*` primitives.

## Verify

```bash
pnpm --filter @needle/ui-web typecheck
pnpm --filter @needle/ui-web test
pnpm --filter @needle/studio dev   # click through, toggle light/dark
```
