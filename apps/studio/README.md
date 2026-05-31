# @needle/studio

The browser demo for `@needle/ui-web`. Open it to see and interact with the
full design system: every template, every feature component, light/dark themes.
See [`docs/v2/studio-redesign.md`](../../docs/v2/studio-redesign.md).

## Run

```bash
pnpm install                        # from repo root
pnpm --filter @needle/studio dev    # opens in the browser
```

## What it shows

- **Left-rail navigation** — a scenario per feature (Today board, countdown,
  coach panel, brain-dump ritual, chat dock, notification settings, template
  gallery, revision timeline).
- **Theme toggle** — light/dark, wired to `prefers-color-scheme` by default.
- **Scenario clock** — fast-forwards time so countdowns and alert-rotation
  are demoable without waiting for real deadlines.

## Structure

```text
src/
  scenarios/    one file per left-rail entry; mounts real ui-web components
  studio.css    rail/topbar/content chrome only — feature styles live in ui-web
  main.tsx      app entry
```

## Important

This is a **demo harness only.** All features and business logic live in
`packages/ui-web`. New scenarios mount real `@needle/ui-web` components — they
do not reimplement features here. `studio.css` is chrome only.
