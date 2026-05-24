# Decision Log

Append a new entry here at the end of every session.
Format: `### YYYY-MM-DD — <topic> (<who made the call>)`

---

### 2026-05-24 — Project scaffold (Ofer)
- Stack: Electron 42 + Forge + Vite + React + TypeScript. Zustand for state. Global CSS + custom properties (no Tailwind).
- Design faithfully ported from `/Users/groot/Downloads/Needle/` hi-fi JSX/CSS files.
- Two screens: Today and Capture (4 states). All data is mock — no AI or DB yet.
- Deferred to later: AI (Anthropic API), SQLite, calendar (EventKit), widget, notifications.

### 2026-05-24 — Vite build fix (AI recommendation, Ofer approved)
- Both `src/main/index.ts` and `src/preload/index.ts` both produced `index.js` → overwrote each other.
- Fix: explicit `lib.fileName` in each vite config → `main.js` / `preload.js` in `.vite/build/`.
- `package.json` main updated to `.vite/build/main.js`.

### 2026-05-24 — Titlebar fixes (Ofer)
- Removed HTML `.lights` div — `titleBarStyle: 'hiddenInset'` already renders native macOS traffic lights.
- Fixed window drag: `.titlebar > *` was applying `-webkit-app-region: no-drag` to `.title-center` (inset:0), blocking all dragging. Scoped `no-drag` to `button, a, input, select` only.
