# Tokens

Needle's design tokens live in `src/renderer/styles/tokens.css`. This doc explains the system, documents the **current** values, and defines the **target** state we're migrating toward.

## Architecture (target)

Three layers. Components only ever reference the semantic layer.

```
1. Primitive  →  raw values        → defined once, never used directly by components
2. Semantic   →  role-based names  → swapped between light and dark
3. Component  →  component tokens  → only when a component needs unique values
```

Modeled on [Radix Colors](https://www.radix-ui.com/colors)' 12-step scale and the [W3C DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) format. We stay in CSS variables for now; we can export to W3C JSON later via Style Dictionary when cross-platform becomes a real requirement.

## Semantic role mapping

Per Radix Colors' semantic step assignments:

| Semantic role | Current token | Step intent | Use for |
|---------------|---------------|-------------|---------|
| `surface-base` | `--bg` | 1 | App background |
| `surface-sub` | `--bg-elev` | 2 | Subtle surface, striped rows |
| `surface-raised` | `--surface` | 3 | Cards, raised panels |
| `surface-hover` | `--surface-sub` | 4 | Hover state on components |
| `surface-active` | *(missing)* | 5 | Pressed / selected component |
| `border-subtle` | `--hairline` | 6 | Non-interactive borders, dividers |
| `border-default` | `--hairline-2` | 7 | Interactive component borders |
| `border-strong` | *(missing)* | 8 | Focus rings |
| `ink-primary` | `--ink` | 12 | High-contrast text (body, headings) |
| `ink-secondary` | `--ink-2` | 11 | Low-contrast text (subtle labels) |
| `ink-tertiary` | `--ink-3` | — | Metadata, captions |
| `ink-quaternary` | `--ink-4` | — | Decorative / placeholder (passes 3:1 not 4.5:1) |

Plus role-specific accents:

| Token | Role | Current light | Current dark |
|-------|------|---------------|--------------|
| `--urgent` / `--urgent-soft` | Urgent state | `#c4622d` | `#e8674a` |
| `--upcoming` / `--upcoming-soft` | Upcoming / positive | `#6f9272` | `#6fbdb4` |
| `--calendar` | Calendar items | `#2c2c3a` | `#b9baca` |
| `--remember` | Remember bucket | `#6b7fa3` | `#b0a4d6` |
| `--accent` | Brand accent (gold) | `#d4a847` | `#f0b429` |

## Current contrast audit (dark mode)

Computed against `--bg: #16161a`. WCAG 2.x relative luminance formula.

| Token | Hex | Ratio on `--bg` | AA body (4.5:1) | AA UI (3:1) |
|-------|-----|-----------------|-----------------|-------------|
| `--ink` | `#f2efe9` | ~14.4:1 | PASS | PASS |
| `--ink-2` | `#bdb7ad` | ~8.7:1 | PASS | PASS |
| `--ink-3` | `#807a70` | ~4.2:1 | **FAIL** | PASS |
| `--ink-4` | `#585249` | ~2.4:1 | FAIL | **FAIL** |

`--ink-3` is the biggest problem — it's used for metadata, sublabels, link tags, dates, drag-handle defaults, etc. Failing 4.5:1 means small secondary text is hard to read in dark mode.

`--ink-4` failing 3:1 is acceptable for decorative use (it's tier 4) but it's being used for icon defaults, which violates UI contrast minimum.

## Target dark-mode token values

Proposed (subject to `needle-dark-mode-fix` review):

| Token | Current | Proposed | New ratio |
|-------|---------|----------|-----------|
| `--ink-3` (dark) | `#807a70` | `#9a948a` | ~5.6:1 PASS |
| `--icon-default` (dark) | *(new)* | `#b6afa3` | ~6.8:1 PASS |
| `--icon-muted` (dark) | *(new)* | `#807a70` | ~4.2:1 (passes 3:1 UI) |
| `--ink-4` (dark) | `#585249` | unchanged | decorative only |

We add **icon-specific tokens** so icon contrast can be tuned independently from text contrast.

## Spacing scale

Currently informal. Standardize on:

```
4, 8, 12, 16, 20, 24, 32, 40, 56
```

No arbitrary `7px` or `13px`. Snap to scale.

## Radius scale

```
4, 6, 8, 12, 16, 999 (pill)
```

## Typography

| Class | Family | Use |
|-------|--------|-----|
| `t-display` | `--serif` (Fraunces) | Screen titles, prompts |
| `t-eyebrow` | `--sans` (Geist) caps | Section eyebrows |
| `t-mono` | `--mono` (Geist Mono) | Keyboard hints, monospace meta |
| (default) | `--sans` (Geist) | Body, labels, UI |

Tracking: `-0.005em` default (already in `body`). Display elements use `-0.01em`.

## Migration status

- [x] Restructure `tokens.css` into primitive + semantic layers (2026-05-26)
- [x] Add `--surface-active` and `--border-strong` tokens (2026-05-26)
- [x] Add `--icon-default` and `--icon-muted` tokens (2026-05-26)
- [x] Add `--ink-disabled` and `--surface-disabled` tokens (2026-05-26)
- [x] Add `--space-*`, `--radius-*`, `--text-*`, `--duration-*`, `--ease-*` scale tokens (2026-05-26)
- [x] Fix dark-mode `--ink-3` value (`#807a70` → `#9a948a`, 4.2:1 → 5.6:1) (2026-05-26)
- [ ] Document component-level tokens (only when a primitive needs one — none yet)
- [ ] Migrate `CaptureScreen` to consume semantic tokens (out of Today refactor scope)

Updated by the relevant skills as work happens.

## Layered architecture as implemented (2026-05-26)

```
src/renderer/styles/
  primitives.css   ← raw values: --sand-*, --ink-*, --urgent-*, --space-*, --radius-*, --text-*, --duration-*, --ease-*
  tokens.css       ← semantic mappings per theme (light / dark), referencing primitives
  global.css       ← resets + domain styling for `.t-row`, `.t-section`, capture-screen classes
```

Primitive components ship their own CSS files alongside their `.tsx` source. Each consumes only semantic tokens.
