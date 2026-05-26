# Sources

Curated trusted sources that informed Needle's design system. **Only high-trust, version-pinned sources.** No random blog prompts, no unverified "AI designer" templates, no enterprise SaaS-driven advice.

Last updated: 2026-05-26

## Official specs

| Source | Why |
|--------|-----|
| [Agent Skills spec — agentskills.io](https://agentskills.io) | Cross-platform skill standard (Cursor, Claude Code, Codex, Gemini CLI, Copilot all support it) |
| [W3C Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/) | Final Community Group Report, Oct 28 2025 — first stable token format spec |
| [Anthropic skills authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) | Progressive disclosure, narrow-bridge, file-system navigation |
| [WCAG 2.2 (W3C Recommendation)](https://www.w3.org/TR/WCAG22/) | Contrast minimums and the "why" |
| [Apple Human Interface Guidelines — macOS](https://developer.apple.com/design/human-interface-guidelines/) | Native macOS conventions |
| [Apple HIG — NSVisualEffectView](https://developer.apple.com/documentation/appkit/nsvisualeffectview) | Vibrancy, materials, semantic label colors |

## High-trust open source

| Repo | Stars | Why |
|------|-------|-----|
| [`anthropics/skills`](https://github.com/anthropics/skills) | ~73k | Canonical skill examples (PDF, DOCX, etc.) |
| [Radix Colors](https://www.radix-ui.com/colors) | Modulz (Radix UI maintainers) | 12-step semantic scale; perceptually uniform; dark mode built in |
| [Radix UI Primitives](https://github.com/radix-ui/primitives) | ~16k | Accessible component primitives |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | ~115k | "Own the code" pattern; CSS variables architecture |
| [Open Props](https://github.com/argyleink/open-props) | ~5.3k | Pure CSS-variable token library; W3C export |
| [Park UI](https://github.com/chakra-ui/park-ui) | ~2.3k | "Share tokens, split implementation" cross-platform pattern |
| [Panda CSS](https://github.com/chakra-ui/panda) | ~6k | Token-first CSS framework (reference only — not adopting) |
| [Style Dictionary v4](https://github.com/style-dictionary/style-dictionary) | Amazon OSS | Token build tool; aligns with W3C DTCG |
| [Ladle](https://github.com/tajo/ladle) | ~2.9k | Vite-native component dev; future Phase 3 |
| [ui-design-brain](https://github.com/carmahhawwari/ui-design-brain) | ~802 | 60+ UI component patterns + anti-patterns (skill reference) |
| [anydesign](https://github.com/uxKero/anydesign) | community | Inspiration for `design.md` inventory pattern |

## Reference articles (read for context, not as authority)

| Source | Why |
|--------|-----|
| [Anthropic — Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) | Background on the skills architecture |
| [Radix — Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) | The 12-step semantic mapping explained |
| [Dark Mode Architecture That Doesn't Leak (DEV)](https://dev.to/abdelaaziz_ouakala/dark-mode-architecture-that-doesnt-leak-a-design-system-approach-for-angular-494m) | Practical 3-layer token enforcement |

## Tools explicitly NOT adopted

| Tool | Why not |
|------|---------|
| Tailwind CSS | Utility-first conflicts with semantic-token-first; we already have CSS variables |
| vanilla-extract | Type-safe is nice, but adds build complexity for marginal win at our scale |
| styled-components / Emotion | Runtime CSS-in-JS — we don't need it |
| Chromatic | SaaS; we'll do local visual checks via Ladle + Playwright `toHaveScreenshot` when needed |
| Storybook | Heavy. Ladle is the Vite-native replacement when component dev kicks off |
| Tokens Studio | Figma plugin; we're not running a Figma-first workflow |
| Supernova / Knapsack / zeroheight | Enterprise design system platforms; overkill |

## Sources that were considered and skipped

- Random Medium "vibe coding" / `.cursorrules` posts — too prompt-injection-prone, too generic
- IBM Carbon — strong system, but enterprise-shaped and Sass-heavy
- Material Design 3 — Google-shaped; we're targeting native macOS
- Any closed-source "AI designer" tool

## Update protocol

Edit this file when a new source genuinely informs the system. Pin versions or dates where stability matters. Remove sources that have been superseded.
