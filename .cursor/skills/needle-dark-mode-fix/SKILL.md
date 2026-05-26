---
name: needle-dark-mode-fix
description: Fix dark mode contrast failures in Needle's design tokens following WCAG 2.2 AA. Use when the user says dark mode is hard to read, icons are invisible, contrast is failing, or asks to recalibrate dark theme. Modifies tokens.css safely with paired light/dark updates and verifies each change against WCAG.
---

# Needle Dark Mode Fix

Narrow-bridge skill. Fixes dark mode contrast issues by recalibrating semantic tokens against WCAG 2.2 AA, one pairing at a time, with verification at each step.

## When to use

Triggers:
- "Dark mode is hard to read" / "I can't see X in dark mode"
- "Fix contrast" / "icons are invisible"
- "Recalibrate dark theme"
- After `needle-ui-audit` flags contrast failures

## Pre-requisites

Run `needle-ui-audit` first if you don't already have a list of failing token pairs. This skill assumes you know which pairings fail.

## Process — narrow bridge, do not deviate

### Step 1 — Confirm the failing pairs

State explicitly which `(text-token, background-token)` pairings are failing, with current ratios. If you don't know, stop and run `needle-ui-audit` first.

### Step 2 — Identify the root cause class

Each fix falls in one of three categories:

| Category | Example | Action |
|----------|---------|--------|
| Token value too dim | `--ink-3` at `#807a70` on `--bg #16161a` = 4.2:1 | Lighten the token in dark theme only |
| Token used for wrong role | Icon uses `--ink-4` (decorative tier) when it should be visible | Introduce a new semantic token (`--icon-default`) instead of widening `--ink-4` |
| Missing semantic separation | Body text and metadata both use `--ink-2` | Split into two semantic tokens with different roles |

State the category before proposing the fix.

### Step 3 — Propose new values

For each failing pair, propose a new value with the resulting ratio computed. Format:

```
--ink-3 (dark)  : #807a70  →  #9a948a   (4.2:1 → 5.6:1) PASS AA
--ink-4 (dark)  : #585249  →  (no change; this is decorative tier)
                              + introduce --icon-default: #b6afa3 (6.8:1) for icons
```

Do NOT change light-mode values unless light mode also fails. Light/dark are independent.

### Step 4 — Confirm before editing

Show the proposed diff to the user. Ask for confirmation before modifying `tokens.css`. This is a high-stakes change — the user must explicitly approve.

### Step 5 — Apply changes

- Edit `src/renderer/styles/tokens.css` only.
- If introducing new semantic tokens (e.g. `--icon-default`), add them to BOTH light and dark blocks. Parity is enforced.
- If renaming or repurposing a token, update every call site (grep usage first; report count).

### Step 6 — Verify

- Run `npm start` is the user's responsibility — but tell them to verify visually.
- Update `design/tokens.md` with the new values and rationale.
- Log the change in `design/decisions.md`: date, what changed, why, who decided.

## Reference contrast formula

Use the WCAG 2.x relative luminance formula:

```
L = 0.2126*R + 0.7152*G + 0.0722*B   (linearized sRGB)
contrast = (L_lighter + 0.05) / (L_darker + 0.05)
```

Minimum thresholds:
- Body text: 4.5:1
- Large text (≥ 24px or 18px bold): 3:1
- UI / icons / borders: 3:1
- Aim for 5.5–7:1 for body text to leave headroom for low-quality displays

## What this skill MUST NOT do

- Modify component code. Only `tokens.css` and design docs.
- Touch light mode unless explicitly asked and light mode also fails.
- Invert light-mode tokens to derive dark-mode values. Always start from dark `--bg` and work up.
- Push values past 7:1 unless asked — pure-white on near-black causes halation.

## Verifying this skill worked

- Every previously failing pair now passes WCAG AA (verified with the formula above)
- `tokens.css` light and dark blocks have matching token names (no orphans)
- `design/tokens.md` reflects the new values
- `design/decisions.md` has the new entry
