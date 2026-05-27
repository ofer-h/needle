# Agent C — Capture Screen Refactor
# Branch: agent/capture-refactor
# Model: claude-sonnet-4-5 (UI refactor, well-defined scope)

## Your mission
The Capture screen (src/renderer/components/Capture/CaptureScreen.tsx) was scaffolded quickly
and still uses raw inline styles, hardcoded hex colors, and violates the design system.
Your job: bring it up to the same quality as the Today screen.

## Read first (in order)
1. scripts/orchestration/KNOWLEDGE_PACK.md
2. design/llms.txt — design system index (MUST READ for any UI work)
3. design/tokens.md — token system
4. design/components.md — component inventory and contracts
5. design/anti-patterns.md — what NOT to do
6. src/renderer/styles/tokens.css — all semantic tokens
7. src/renderer/styles/primitives.css — raw value scale
8. src/renderer/components/Capture/CaptureScreen.tsx — what you are refactoring
9. src/renderer/components/primitives/ — the primitive library you should USE
10. src/renderer/components/Today/TodayScreen.tsx — reference quality bar
11. memory/context.md

## What to build

### Step 1: Audit CaptureScreen.tsx
Before touching anything, write your audit to scripts/orchestration/logs/agent-capture-refactor.log:
- List every inline style found (property + value)
- List every hardcoded hex or rgba color
- List every magic number (px values not from token scale)
- List current lint errors (run: npm run lint -- src/renderer/components/Capture/)
- Identify which existing primitives can replace current markup

### Step 2: Create CaptureScreen.css
Create src/renderer/components/Capture/CaptureScreen.css (it does not exist yet).
Move ALL styles from inline to this file.
Rules:
- No hex colors. Use semantic tokens: var(--surface-base), var(--ink-1), var(--accent-primary), etc.
- No magic px numbers. Use token scale: var(--space-2), var(--radius-2), var(--text-16), etc.
- All classes namespaced: .capture-* 
- Dark mode works automatically via tokens (do NOT add [data-theme="dark"] overrides unless fixing contrast)
- Respect prefers-reduced-motion for any transitions

### Step 3: Refactor CaptureScreen.tsx
Replace inline styles with className references.
Where existing primitives fit, use them:
- <Button> for action buttons
- <Checkbox> for any checkbox-like controls
- <Icon> / <IconButton> for icon buttons
- <Pill> for labels/states
- <Divider> for separators

The Capture screen has 4 states (from PRD.md): idle, capturing, classifying, done.
Make sure all 4 states are covered and styled correctly.

### Step 4: Fix all lint errors
Run npm run lint -- src/renderer/components/Capture/
Fix every error. Common issues in this file:
- Unescaped JSX text (use &apos; &amp; etc.)
- Missing types on props
- Unused variables

### Step 5: Verify dark mode
The app uses [data-theme="dark"] on <html> for dark mode.
Check every color in your CSS:
- Background surfaces: should use --surface-base, --surface-raised, --surface-overlay
- Text: --ink-1 (primary), --ink-2 (secondary), --ink-3 (tertiary/muted)
- Borders: --border-default, --border-strong
- Interactive: --accent-primary, --accent-secondary

Minimum contrast ratios (WCAG AA):
- Body text on background: 4.5:1
- Large text / UI components: 3:1

### Step 6: Run full verification
```
npm run typecheck
npm run lint
npm run build
```
All must pass. Fix everything before reporting done.

## Capture screen states reference (from PRD.md)
- Idle: empty input, placeholder text, capture button
- Capturing: user is typing — input active, character count, submit affordance
- Classifying: spinner/animation while AI processes (mock: 1.5s delay)
- Done: shows the classified result (bucket: Act or Remember, suggested time if Act)

The classifying → done transition should feel satisfying. Use CSS transitions, not JS timers.

## What NOT to do
- Do NOT change the component's external API (props, exports)
- Do NOT add new npm packages
- Do NOT add inline styles (the whole point of this task)
- Do NOT change CaptureWindow.tsx or CaptureWindow.css (separate component, out of scope)
- Do NOT refactor CaptureWindow.tsx imports — just the CaptureScreen

## Commit cadence
  agent/capture-refactor: audit capture screen — log inline styles and lint errors
  agent/capture-refactor: create CaptureScreen.css with token-based styles
  agent/capture-refactor: replace inline styles with classNames, use primitives
  agent/capture-refactor: fix all lint errors
  agent/capture-refactor: verify typecheck + build pass

## Done when
- [ ] CaptureScreen.css exists with all styles token-based
- [ ] Zero inline styles in CaptureScreen.tsx
- [ ] Zero hardcoded hex/rgba colors
- [ ] All 4 capture states styled correctly
- [ ] Dark mode works
- [ ] npm run typecheck passes
- [ ] npm run lint passes (for Capture files specifically)
- [ ] npm run build passes
- [ ] Report written to scripts/orchestration/reports/agent-capture-refactor.md
