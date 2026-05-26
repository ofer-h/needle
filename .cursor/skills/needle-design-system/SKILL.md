---
name: needle-design-system
description: Discovery and navigation hub for Needle's design system. Use when the user asks about tokens, themes, dark mode, components, design system, design audit, design refactor, design review, or anything that touches Needle's visual layer. Routes to specialized skills for audit, refactor, dark-mode fix, token migration, and component build.
---

# Needle Design System — Discovery

Use this skill as the entry point when the user asks about anything design-system related. It maps the user's intent to the right specialized skill and points at the right docs.

## When to use

Trigger phrases include:
- "design system", "tokens", "theme", "dark mode"
- "audit the UI", "review components", "what's missing"
- "fix contrast", "fix dark mode"
- "extract a Button / Chip / primitive"
- "migrate inline styles"
- "what's the convention for X"

## Process

1. **Read the index.** Open `design/llms.txt` first — it lists every doc and what's in it. Use this to ground your understanding.

2. **Classify the user's intent**:

   | Intent | Skill to invoke |
   |--------|-----------------|
   | "Audit / review / inventory" | `needle-ui-audit` |
   | "Fix dark mode contrast" | `needle-dark-mode-fix` |
   | "Replace raw hex / inline styles" | `needle-token-migration` |
   | "Build a new component / extract a primitive" | `needle-build-component` |
   | "Just understanding the system" | Read `design/tokens.md` + `design/components.md` and explain |

3. **Hand off**. Tell the user which skill you're using and why, then invoke it. Example: *"Invoking `needle-ui-audit` because you asked to review the Today screen."*

4. **Stay in scope**. If the user's request spans multiple skills, do them one at a time. Don't combine audit + refactor in one pass — they have different freedom levels.

## Reference docs (in priority order)

- `design/llms.txt` — index of everything
- `design/tokens.md` — current and target token system
- `design/components.md` — inventory + per-component contracts + gaps
- `design/anti-patterns.md` — explicit don'ts with examples
- `design/sources.md` — pinned trusted research links
- `.cursor/rules/design-tokens.mdc` — token discipline
- `.cursor/rules/design-dark-mode.mdc` — contrast rules
- `.cursor/rules/design-macos.mdc` — native Mac conventions
- `.cursor/rules/design-components.mdc` — component API conventions

## What this skill MUST NOT do

- Modify code directly. That's the job of the specialized skills.
- Skip the routing step. Always identify which sub-skill applies.
- Invent design rules. If a rule isn't in the docs, propose adding it through the proper skill.

## Verifying this skill worked

The user gets a clear answer about what's happening next, which specialized skill is taking over, and where the relevant docs live.
