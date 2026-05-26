# Anti-patterns

Things we explicitly do NOT do in Needle's UI. Each entry has a concrete example so the rule is unambiguous.

## Tokens & styling

### ❌ Raw hex in `.tsx`

```tsx
// Bad
<div style={{ color: '#666' }}>…</div>

// Good
<div style={{ color: 'var(--ink-3)' }}>…</div>
```

Even worse: hex inside a long inline style object. Extract to a CSS class.

### ❌ Inverting light-mode values to derive dark-mode

```css
/* Bad — quietly fails contrast */
[data-theme='light'] { --ink-3: #666; }
[data-theme='dark']  { --ink-3: #999; }

/* Good — recalibrated per theme, verified against WCAG */
[data-theme='light'] { --ink-3: #7a6e5d; }   /* 5.6:1 on light bg */
[data-theme='dark']  { --ink-3: #9a948a; }   /* 5.6:1 on dark bg */
```

Always verify each pairing independently.

### ❌ Primitive tokens in component code

```tsx
// Bad — leaks the primitive layer
<div style={{ background: 'var(--sand-50)' }} />

// Good — semantic intent
<div style={{ background: 'var(--surface-base)' }} />
```

If the semantic token doesn't exist for what you're doing, add one — don't reach down to the primitive.

### ❌ Off-scale spacing or radius

```tsx
// Bad
<div style={{ padding: '7px 13px', borderRadius: 9 }} />

// Good — snap to scale (4/8/12/16, radius 4/6/8/12/16/999)
<div style={{ padding: '8px 12px', borderRadius: 8 }} />
```

## Components

### ❌ Boolean flags that mean different things together

```tsx
// Bad — what does isPrimary + isDanger mean?
<Button isPrimary isDanger>Delete account</Button>

// Good — variant union
<Button variant="danger">Delete account</Button>
```

### ❌ Component knows about its parent's layout

```tsx
// Bad — TaskRow imposes its own margins on the timeline
<div className="t-row" style={{ marginTop: 26 }}>…</div>

// Good — parent owns layout, child is unaware
<Section><TaskRow … /></Section>
```

### ❌ Children + label both holding the same content

```tsx
// Bad — ambiguous API
<Button label="Save">Save</Button>

// Good — pick one
<Button>Save</Button>
// or
<Button label="Save" />
```

### ❌ Disabling focus styles without replacement

```css
/* Bad — kills keyboard accessibility */
button:focus { outline: none; }

/* Good — replace, don't remove */
button:focus-visible {
  outline: 2px solid var(--border-strong);
  outline-offset: 2px;
}
```

### ❌ Array indices as keys for reorderable lists

```tsx
// Bad — DnD breaks
{tasks.map((task, i) => <TaskRow key={i} … />)}

// Good
{tasks.map(task => <TaskRow key={task.id} … />)}
```

## Dark mode specifically

### ❌ Pure white text on near-black

```css
/* Bad — halation, eye strain */
[data-theme='dark'] { --ink: #ffffff; }

/* Good — slightly warm off-white */
[data-theme='dark'] { --ink: #f2efe9; }
```

### ❌ Same gray for icons as for body text

Icons are UI elements (3:1 minimum). Body text is content (4.5:1 minimum). They have different needs.

```css
/* Bad — one token for both */
color: var(--ink-3);  /* for body AND icons */

/* Good — separate semantic tokens */
color: var(--ink-3);            /* body text */
color: var(--icon-default);     /* icon defaults */
color: var(--icon-muted);       /* icon de-emphasized */
```

### ❌ `opacity: 0.5` for disabled state

Opacity multiplies against the background. A 4.5:1 token at 0.5 opacity is no longer 4.5:1.

```css
/* Bad */
button:disabled { opacity: 0.5; }

/* Good — explicit disabled tokens */
button:disabled {
  color: var(--ink-disabled);
  background: var(--surface-disabled);
  cursor: not-allowed;
}
```

## Process

### ❌ "While I'm in there" refactors

If the task is to fix dark mode contrast, do NOT also rename props, reformat unrelated files, or restructure folders. One concern per change. Mention things worth fixing separately; don't silently expand the diff.

### ❌ Adding tokens without contrast verification

Every new color token must be paired with the surfaces it'll be used on, and verified at the time of addition. Use `needle-add-token` (when it exists) or `needle-dark-mode-fix`.

### ❌ Skills modifying code without explicit user approval

Analysis skills (`needle-ui-audit`) are read-only. Refactor skills (`needle-dark-mode-fix`, `needle-token-migration`) show a diff and require confirmation before editing.
