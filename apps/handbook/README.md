# @needle/handbook

Static **Needle Project Handbook** — product, app UX, architecture, infra education,
decisions, roadmap, and rendered `docs/**` + `design/**` reference.

Built with [Astro](https://astro.build) (static output). Lives in the monorepo as both
documentation and an example of the tooling described on the Infra 101 pages.

## Run

From the repo root:

```bash
pnpm install
pnpm --filter @needle/handbook dev      # http://localhost:4321
pnpm --filter @needle/handbook build    # output: apps/handbook/dist/
pnpm --filter @needle/handbook preview # serve dist/
```

## Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Astro dev server with HMR |
| `build` | Static site to `dist/` |
| `preview` | Preview production build |
| `typecheck` | `astro check` + `tsc --noEmit` |
| `lint` | ESLint over `src/` |

## Structure

```text
src/
  config/nav-config.ts   # single nav source (do not edit from content-only work)
  layouts/Layout.astro   # shell: sidebar, header, footer, theme
  pages/                 # curated explainer routes
  lib/reference.ts       # reads ../../docs and ../../design at build time
  styles/global.css      # Needle theme (from desktop tokens)
```

Content agents should only add/edit files under their route folder (`pages/product/`,
`pages/app/`, etc.) — not `nav-config.ts` or `Layout.astro`.

## Reference docs

At build time, `src/lib/reference.ts` walks the repo-root `docs/` and `design/` trees
and generates `/reference/<category>/<path>/` pages. No duplicate markdown copy inside
this app.
