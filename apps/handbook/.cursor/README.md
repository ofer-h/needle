# Handbook Agent Note

`apps/handbook` owns its Astro-specific rules and skills locally, following the
per-app convention in `docs/v2/migration-progress.md`.

Agents editing this app should keep shared scaffold files stable:

- Do not edit `src/config/nav-config.ts` unless the orchestrator explicitly changes the IA.
- Do not edit `src/layouts/Layout.astro` or `src/styles/global.css` during content-only work.
- Content agents should replace only their owned route files listed in the nav config.
