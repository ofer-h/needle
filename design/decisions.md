# Design decisions

Chronological log of design-system decisions. Separate from `memory/decisions.md` (which is project-wide) — this one tracks only the visual / design layer.

Format per entry:
- **Date**
- **Topic**
- **Decided by** (Ofer / Omri / both / AI recommendation accepted by …)
- **Context** — what changed and why
- **Open questions** (if any)

---

## 2026-05-26 — AI-first design system foundation

**Decided by:** Ofer accepted AI recommendation
**Context:**
- Built persistent AI-readable layer **before** touching app code: 4 always-on rules, 5 skills, 5 design docs.
- Aligned to gold-standard sources only (Anthropic Skills spec, Radix Colors, W3C DTCG, WCAG 2.2 AA, Apple HIG).
- Lean core: deliberately did NOT build a full 12-skill set. Will expand based on real use.
- Project-level (`.cursor/skills/`) over personal — knowledge persists in the repo.
- Chose to stay with CSS variables (no Tailwind, no vanilla-extract introduction). Restructure into 3 layers, not switch frameworks.
- Spec: `docs/superpowers/specs/2026-05-26-needle-design-system-design.md`

**Open questions:**
- When Phase 2 lands, do we restructure `tokens.css` into separate `primitives.css` + `tokens.css`, or keep one file with `@layer` rules?
- Component primitives folder: confirmed `src/renderer/components/primitives/` once we start extracting (not built yet).

---

## 2026-05-26 — Today screen audit (Ofer requested, AI executed)

**Decided by:** Ofer (asked); AI ran `needle-ui-audit`. No code changes — read-only audit + docs update.

**Context:**
- Scope: Today screen only — `TodayScreen.tsx`, `TaskRow.tsx`, `EventRow.tsx`, `Section.tsx` and the tokens/CSS they touch.
- Inventory: 4 in-folder components + 2 inline sub-components (`GapDropZone`, `OverlayRow`) inside `TodayScreen.tsx`. `Section` is the only clean one.
- Discipline violations: 2 raw rgba values, ~15 inline style blocks in `TodayScreen.tsx`, inline-style duplication of existing CSS in `EventRow`, three-way duplication of row markup (`FixedTaskRow` / `FlexibleTaskRow` / `OverlayRow`), sub-toolbar/scroll-area gutter mismatch (40px vs 32px) causing visible misalignment.
- Contrast: confirmed `--ink-3` and `--ink-4` failures in **both** themes (dark was known; light is new — light pill text on `*-soft` backgrounds also fails). Light-mode `--ink-3` lands at ~4.45:1 (knife-edge fail of 4.5).
- Accessibility blockers: no `:focus-visible` anywhere; quick-add `div` not keyboard-operable; drag-handle not keyboard-reachable.
- PRD coverage gaps: inline expansion, empty state, completion animation, "NOW"/"COMING UP" serif labels, single-FAB nav, store-driven upcoming list — none implemented.

**Recommended next actions (in order):**
1. `needle-dark-mode-fix` — recalibrate `--ink-3` light + dark, add `--icon-default` / `--icon-muted`.
2. `needle-token-migration` — start with `EventRow` (lowest cost), then `TaskRow`.
3. `needle-build-component` — `Pill` → `Button` → `Kbd` → `Checkbox` → `IconButton`, then `TaskRowCore` to collapse the three-way duplication.
4. Accessibility pass (no skill yet) — `:focus-visible`, quick-add keyboard, `aria-expanded`, `@dnd-kit` `KeyboardSensor`.

**Open questions for Omri:**
- Three add-task affordances on the Today screen (sub-toolbar Add task + quick-add row + FAB). PRD says one. Which stays?
- "NOW" / "COMING UP" serif eyebrow labels + inline expansion + completion animation — confirm priority vs. shipping the v1 shell as-is.
- Color signaling per task (priority dot + checkbox border + pill) is louder than PRD's "warm, copy-only" direction. Worth a design call.
