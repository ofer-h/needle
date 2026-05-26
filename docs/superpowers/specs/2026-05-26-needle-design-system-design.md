# Needle Design System — AI-First Foundation

**Date:** 2026-05-26
**Driven by:** Ofer (initial ask), Omri (product alignment expected)
**Status:** Approved — building lean core

## Summary

Establish the persistent AI-readable knowledge layer for Needle's design system, before any code refactor. The output is Cursor rules + Agent Skills + machine-readable design docs — all version-controlled in the repo so every future agent (Cursor, Claude Code, Codex, any cross-platform tool that supports the [Agent Skills standard](https://agentskills.io)) inherits the system automatically.

This phase touches **no application code**. It builds the scaffolding that makes the next refactor disciplined.

## Problem

1. **Dark mode contrast fails WCAG AA.** `--ink-3` (~4.2:1) and `--ink-4` (~2.4:1) on `--bg` make icons and secondary text hard to read.
2. **Design system isn't formalized.** Tokens are one flat layer in `tokens.css`. Components mix global classes with inline `style={{}}`. No primitive → semantic → component hierarchy.
3. **No shared component vocabulary.** `Button`, `Chip`, `Checkbox`, `Pill`, `Icon` aren't extracted as reusable primitives — they're inlined per screen.
4. **Knowledge dies between AI sessions.** Each new chat re-discovers the same conventions from scratch.

## Non-goals

- Switching CSS framework (no Tailwind, no vanilla-extract — current CSS-variables approach stays).
- Cross-platform (web/mobile) build pipeline. Defer until macOS desktop is solid.
- Visual regression testing tools. Defer to Phase 3.
- Touching application code. This phase is docs + rules + skills only.

## Gold-standard sources we align to

All version-pinned, all high-trust:

| Source | Why |
|--------|-----|
| [Anthropic Agent Skills spec](https://agentskills.io) + [`anthropics/skills`](https://github.com/anthropics/skills) | Cross-platform skill standard |
| [Radix Colors](https://www.radix-ui.com/colors) — 12-step semantic scale | Token role mapping |
| [W3C DTCG 2025.10](https://www.designtokens.org/tr/2025.10/) | Future-proof token format |
| [ui-design-brain](https://github.com/carmahhawwari/ui-design-brain) (802 ⭐) | 60+ component best-practices |
| WCAG 2.2 AA | Accessibility floor |
| [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/) — semantic labels, materials | Native macOS feel |
| [Open Props](https://github.com/argyleink/open-props) (5.3k ⭐) | Pure CSS variables philosophy |

## Architecture

Three layers of AI-readable knowledge:

```
.cursor/rules/          ← Always-on discipline (auto-attach by glob)
.cursor/skills/         ← Workflows (loaded on demand, progressive disclosure)
design/                 ← Living docs (consumed by humans and AI)
```

### `.cursor/rules/` — Always-on discipline (4 files)

| File | Globs | Purpose |
|------|-------|---------|
| `design-tokens.mdc` | `src/renderer/**/*.{tsx,css}` | 3-layer token discipline; no raw hex in components |
| `design-dark-mode.mdc` | same | WCAG AA minimums; semantic tokens swap per theme |
| `design-macos.mdc` | same | Native macOS conventions for ink hierarchy, materials, motion |
| `design-components.mdc` | `src/renderer/components/**/*.tsx` | Component API conventions and file structure |

Each ≤ 50 lines. Focused. Actionable.

### `.cursor/skills/` — Workflows (5 skills)

Each is a folder with a `SKILL.md` (per [agentskills.io spec](https://agentskills.io)):

| Skill | When agent invokes | Type |
|-------|--------------------|------|
| `needle-design-system` | Discovery: "design system", "tokens", "theme" | Umbrella router |
| `needle-ui-audit` | "audit UI", "what's missing", "review components" | Analysis |
| `needle-dark-mode-fix` | "fix dark mode", "contrast issues" | Refactor (narrow bridge) |
| `needle-token-migration` | "migrate to tokens", "remove raw hex" | Refactor (narrow bridge) |
| `needle-build-component` | "add component", "new UI piece" | Build (template) |

### `design/` — Living docs (5 files)

| File | Purpose |
|------|---------|
| `llms.txt` | Machine-readable index (per llmstxt.org spec) |
| `tokens.md` | Token reference: current state + target state + role of each step |
| `components.md` | Inventory: per-component purpose, props, variants, states, status |
| `anti-patterns.md` | Concrete don'ts with code examples |
| `sources.md` | Pinned trusted research links from this session |

## Workflow once built

```
User: "Audit the Today screen UI"
  ↓
Cursor auto-loads design-tokens.mdc + design-components.mdc (glob match)
  ↓
Agent reads design/llms.txt → sees the index
  ↓
Agent invokes needle-ui-audit skill (description matches)
  ↓
Skill loads its checklist + reads design/components.md
  ↓
Agent produces audit report, updates components.md
```

This persists between sessions. Future agents inherit the system.

## Component / data flow boundaries

- Rules live under `.cursor/rules/`. They are stateless config consumed by Cursor at session start.
- Skills live under `.cursor/skills/`. They are stateless markdown consumed on demand. They MAY reference `design/` docs and read source files. They MUST NOT modify code without explicit user approval.
- `design/` docs are the source of truth for design decisions. Skills update these docs when work changes the design system.
- Application code (`src/renderer/**`) is NOT touched in this phase.

## Testing strategy

- **Skills**: Test by invocation. Each skill includes a "How to verify this skill worked" section.
- **Rules**: Validated implicitly — if rules conflict or fire incorrectly, the agent reports it.
- **Docs**: Reviewed by Ofer manually. Updated by skills as work happens.

No automated tests in this phase. Phase 2 introduces Vitest contrast checks.

## Phased rollout

| Phase | When | What |
|-------|------|------|
| **1 — This spec** | Now | Build rules + skills + docs. No app code. |
| **2 — First use** | Next session | Run `needle-ui-audit`, fix dark mode using `needle-dark-mode-fix`, restructure `tokens.css` into 3 layers. |
| **3 — Component extraction** | After Phase 2 | Use `needle-build-component` to extract `Button`, `Chip`, `Checkbox`, `Icon` as proper primitives. Add Ladle. |
| **4 — Cross-platform** | When mobile/web starts | `design/tokens.json` (W3C DTCG) + Style Dictionary. |

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Skills/rules drift from code | Skills update `design/components.md` whenever they touch a component |
| AI rationalizes away rules | Always-on rules + skill descriptions include explicit triggers |
| Over-engineering | Lean core (5 skills, not 12). Add more only when real use shows the gap |
| Decisions get lost | `memory/decisions.md` logs every design decision (existing pattern) |

## Success criteria

- A new Cursor session opened on this repo automatically loads the rules and discovers the skills.
- Asking "audit the Today screen" produces a structured report without further prompting.
- Asking "fix dark mode contrast" follows the documented narrow-bridge workflow.
- `design/llms.txt` indexes every doc; any agent can navigate the system from there.
