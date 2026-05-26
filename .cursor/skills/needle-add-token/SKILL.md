---
name: needle-add-token
description: Add a new design token to Needle's design system properly. Use when the user wants to introduce a new color, spacing value, radius, shadow, or any other design value, or when another skill (needle-build-component, needle-token-migration) needs a token that doesn't exist yet. Adds primitive + semantic layers for both light and dark, verifies WCAG contrast for color tokens, and updates docs.
---

# Needle — Add Token

Adds a new design token through the full 3-layer pipeline. Always paired (light + dark). Always verified.

## When to use

Triggers:
- "We need a new color for X"
- "Add a token for hover/active/disabled state"
- "I want a new spacing/radius value"
- A different skill stops and reports "this token doesn't exist yet"

## Pre-requisites

The new token must have a clear **semantic role**. If you can't name what role it plays ("`--icon-default`", "`--surface-active`"), stop and clarify first.

## Process

### Step 1 — Classify the token type

| Type | Where it lives |
|------|----------------|
| Color | `tokens.css` semantic + `primitives.css` primitive (once split) |
| Spacing | `tokens.css` `--space-N` |
| Radius | `tokens.css` `--radius-N` |
| Shadow | `tokens.css` `--shadow-*` |
| Typography | `tokens.css` `--font-*`, `--text-*`, `--leading-*`, `--tracking-*` |
| Motion | `tokens.css` `--duration-*`, `--ease-*` |

### Step 2 — Define the semantic name

Use role-based naming. Examples:

| ✅ Good | ❌ Bad |
|--------|--------|
| `--icon-default` | `--gray-9` |
| `--surface-active` | `--press-bg` |
| `--ink-disabled` | `--text-faded` |
| `--shadow-overlay` | `--shadow-big` |

Names describe what the token IS used for, not how it looks.

### Step 3 — Pick the underlying values

For **color** tokens, pick a value PER theme. Never invert.

For **other** scalar tokens, pick once — unless light/dark have different feel needs (e.g. shadows usually differ between themes).

State the values explicitly:

```
--icon-default (light): #6a614f   (calculate ratio on --bg)
--icon-default (dark) : #b6afa3   (calculate ratio on --bg)
```

### Step 4 — Verify WCAG contrast (color tokens only)

For each surface this token might appear on, compute contrast:

```
Pair                              Light ratio   Dark ratio   Minimum   Pass?
─────────────────────────────────────────────────────────────────────────
--icon-default on --bg            7.1:1         6.8:1        3:1       PASS
--icon-default on --surface-sub   6.8:1         6.4:1        3:1       PASS
```

If any pair fails, pick a different value. Don't proceed with a failing token.

Use the WCAG 2.x formula:
```
L = 0.2126*R + 0.7152*G + 0.0722*B   (linearized sRGB)
contrast = (L_lighter + 0.05) / (L_darker + 0.05)
```

Minimums:
- Body text: 4.5:1
- UI / icons / borders: 3:1
- Large text: 3:1

### Step 5 — Confirm before editing

Show the user:
- Token name
- Primitive value (if applicable) + semantic mapping for both themes
- Contrast pairings + ratios
- Where it will be used

Ask for explicit approval before editing `tokens.css` / `primitives.css`.

### Step 6 — Apply

- Edit `src/renderer/styles/tokens.css` (and `primitives.css` once split).
- Add the token to **both** `[data-theme='light']` and `[data-theme='dark']` blocks. Parity is enforced.
- Do NOT use the token in components yet. That's a separate step (`needle-token-migration` or `needle-build-component`).

### Step 7 — Document

- Append the new token to `design/tokens.md` in the relevant table.
- Log the addition in `design/decisions.md`: date, token name, why it was needed, what it solves.

## What this skill MUST NOT do

- Add a token without a clear semantic role.
- Skip the contrast check for color tokens.
- Use the new token in components in the same edit. Separate concern, separate skill invocation.
- Add light-only or dark-only tokens. Both themes get the token, even if values match.

## Verifying this skill worked

- New token exists in both light and dark blocks of `tokens.css`.
- For color tokens, every plausible surface pairing passes WCAG.
- `design/tokens.md` has the new entry.
- `design/decisions.md` has the log entry.
- No component has been edited (separation of concerns).
