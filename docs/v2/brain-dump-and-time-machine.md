# Brain Dump & Time Machine

> Status: design/spec. Part A buildable now; Part B is a future flagged track (WP-B8),
> disabled by default, no code yet.

**Parent plan:** [needle-next-master-plan.md](needle-next-master-plan.md) §7 DOC-A2 + §9.1.
**Cross-reference:** [../superpowers/specs/2026-05-31-macos-accessibility-capture.md](../superpowers/specs/2026-05-31-macos-accessibility-capture.md) — architectural research on ScreenCaptureKit, AVAssetWriter, mic/audio, and metadata capture that this doc builds on.

---

## Contents

- [Part A — Brain-Dump UX](#part-a--brain-dump-ux)
- [Part B — macOS Time Machine Capture (future, flagged)](#part-b--macos-time-machine-capture-future-flagged)
- [Privacy Stance](#privacy-stance-non-negotiable)
- [Permissions & Entitlements](#permissions--entitlements)
- [Extra Ideas](#extra-ideas-brainstorm)
- [Phasing](#phasing)

---

## Part A — Brain-Dump UX

### What it is

The brain dump is the moment Needle actually earns its keep. Before you rush into the
next task or meeting, it stops you, asks you to offload what's still live in your head,
and confirms you're ready to begin something new. Done right, this is the simplest thing
in the product — one surface, one job.

> "Very simple but powerful." — Ofer

### The unified surface

There is exactly one brain-dump surface. It is not a modal on top of a modal. It is not a
capture window that races a torch window. It is the `brain_dump` block inside the unified
`TransitionOverlay` (WP-B4), which also contains the countdown, the optional breath, and
the skip/postpone/fuse controls. One surface, driven by the ordered system blocks that
`deriveTransitionBlocks()` emits for the anchor.

The brain-dump block occupies the foreground when its turn arrives in the 5/5/5 sequence.
The rest of the sequence is visible but dimmed — the user can see what is coming without
being interrupted by it.

### Core interaction

The brain-dump asks one question per transition. The default question is drawn from
a small rotation pool to fight habituation (see §9.3 in the master plan):

- "What do you need to hand off?"
- "What are you still holding?"
- "What would you forget if you walked away right now?"
- "What does the next-you need to know?"

The user types freely. There is no formatting markup (`*`, `**`, bullet syntax). A plain
textarea. The submit trigger is either the Enter key (configurable) or an explicit
"Done, let go" button — whichever feels less pressured in settings.

### "Where to pick up from"

Submitted dumps are stored as `Item`s of kind `brain_dump` linked to the anchor via
`ItemRelation(type='generated_from')`. They are visible on the Today timeline as a
dated breadcrumb: "Before 3 PM stand-up · 2:55 PM". Tapping the breadcrumb opens
the dump text so the user can recover exactly where they left off.

This directly addresses the ADHD pain of "what was I doing" after an interruption.

### Optional voice narration

A microphone icon in the corner of the dump surface lets the user speak instead of type.
Voice recording is transcribed on-device using macOS's `SFSpeechRecognizer` (no network
call). The transcript populates the textarea as an editable draft. The raw audio is
discarded after transcription. Voice is off by default; the user opts in per-session
or globally in settings. Requires `NSMicrophoneUsageDescription`.

Voice narration during a brain dump is categorically different from the rolling screen
buffer in Part B — it is a short, explicit, user-initiated clip that disappears
once transcribed. No storage, no playback.

### In-dump chat

A "Ask a question" affordance collapses into the dump surface (not a separate panel).
While writing the dump, the user can ask the AI a quick clarifying question:
"How long does it take to get to the school?" or "When is the next checkpoint on
this project?" The AI responds in a compact, non-intrusive way inside the dump view.
The interaction is powered by the existing `ChatDock` / `applyChat` mechanics in
`@needle/ui-web/model/chat.ts`.

### Per-block countdown

The dump block shows a small countdown timer for the allotted minutes (default 5).
This is rendered by the existing `BrainDump.tsx` component in `@needle/ui-web`, which
already has per-block countdown and skip/postpone cost mechanics. WP-B4 wires this
into the unified overlay rather than invoking it as a standalone panel.

### Relation to existing components

| What | Where it lives | WP |
|---|---|---|
| `BrainDump.tsx` (per-block countdown, skip/postpone, cost) | `packages/ui-web/src/components/BrainDump.tsx` | WP-B4 feeds it from `deriveTransitionBlocks` |
| `TransitionOverlay` (unified container) | Does not exist yet (Part A new work) | WP-B4 |
| `brain_dump` block kind in `deriveTransitionBlocks()` | Does not exist yet | WP-B3 |
| `Item(kind: 'brain_dump')` storage + `generated_from` relation | `@needle/domain` `domain-v2.ts` | WP-B3 |
| `applyChat` + `ChatDock` (in-dump questions) | `packages/ui-web/src/model/chat.ts` | Already built; WP-B4 wires in |

---

## Part B — macOS Time Machine Capture (future, flagged)

> This entire section is forward-looking. WP-B8 is the implementation spike. It is
> OFF by default, gated by a feature flag, and no entitlement or signing changes
> are made without an explicit owner sign-off (Decision D8, `macos.mdc`).

### The idea

Just before (or during) a brain dump, Needle can optionally surface a short clip of
what you were just doing — a 5–10 minute rolling buffer of screen, voice, and context
metadata. The user hits "Save last 5 min" and gets a local clip they can scrub, attach
to a task, or let the AI summarize into a draft dump. This is not surveillance — it is
a short window around a deliberate transition, and it is entirely local.

### Rolling buffer architecture

**Stack:** ScreenCaptureKit (SCK, macOS 12.3+) → `AVAssetWriter` with
`movieFragmentInterval` → fragmented MP4 ring buffer on a local temp directory.

| Parameter | Value | Rationale |
|---|---|---|
| Resolution | ~720p (1280×720) | Legible but small; scales on Retina |
| Frame rate | 5 fps | Enough to follow code/browser; static content loads fine |
| Codec | H.264 (fallback) / HEVC H.265 (preferred on Apple Silicon) | Hardware VTCompressionSession; <2% CPU on M-series |
| Bitrate | ~500 kbps | ~3.75 MB/min; 10-min buffer ≈ 37.5 MB |
| Segment size | 5-second fragmented MP4 (fMP4) chunks | Keeps the file readable mid-write; trivial stream-copy merge |
| Buffer length | User-configurable: 5, 10, or 15 minutes | Default 5 min |
| Ring eviction | When segment count exceeds the cap, delete the oldest chunk from disk | Rolling, no disk blowup |

**Why fragmented MP4 (`movieFragmentInterval`) instead of a memory ring buffer:**
The file remains parseable at any point mid-write — if Needle crashes, the last complete
fragment is recoverable. There is no merge step; save is a stream-copy concat (no
re-encoding). See the accessible spec cross-reference for the AVAssetWriter pattern.

**Save flow:** The user taps "Save last 5 min" (or a configurable shorter span). Needle
identifies the matching segments, stream-copies them into a single `.mp4` in the user's
Documents/Needle folder, and optionally attaches the clip to the current brain-dump `Item`.
No re-encoding. Fast, even on long buffers.

### Gotchas from practitioners

- **SCK error 3821:** ScreenCaptureKit throws error code 3821 and disconnects the stream
  under memory or GPU pressure (e.g. rendering a heavy browser tab or a game). The sidecar
  must implement exponential backoff reconnect and report a visible indicator when the
  buffer is interrupted. Saved clips should note any gap.
- **Mic + system audio need separate `AVAssetWriterInput`s:** If you interleave mic audio
  and system audio on the same input, the container gets corrupted. Each audio source
  needs its own `AVAssetWriterInput` with a matching `AVAudioFormat`; the writer handles
  interleaving internally.
- **Window exclusion filter:** SCK supports `SCContentFilter` to exclude specific windows
  from capture. This is how per-app/site exclusion (password managers, banking, incognito)
  is implemented cleanly — no post-processing redaction needed.

### Voice narration in the buffer

Voice narration in Part B is structurally different from Part A's transcribe-and-discard
approach. Here the user's microphone audio is recorded alongside the screen into the
fragmented MP4, stored in the buffer, and included in the saved clip. If the user enables
voice-in-buffer (off by default, separate toggle), they can speak as they work and have
their narration preserved in the clip.

The implementation requires a second `AVAssetWriterInput` (see gotchas above) connected
to `kAudioDevicePropertyDeviceIsRunningSomewhere` on the default microphone device.

### Context capture (rich metadata timeline)

While the buffer runs, the sidecar writes a parallel JSON metadata file tracking:

| Signal | API | Notes |
|---|---|---|
| Frontmost app (name + bundle ID) | `NSWorkspace.shared.frontmostApplication` | Polled ~1/s |
| Browser active URL | `AXUIElement` on browser's address bar | Requires Accessibility permission |
| Selected text | `AXUIElement` `AXSelectedText` attribute | Requires Accessibility permission |
| Cursor position + click trail | Global `NSEvent` monitor (mouse moved/clicked) | Rendered as a transparent click-through overlay; recorded into the video stream |

The metadata file carries timestamps matching the video timeline, so a saved clip
can attach a structured summary: "12.4 s — Chrome — github.com/needle/issues/42;
34.1 s — VS Code — src/model/transition.ts".

This metadata is what allows AI to generate a useful brain-dump draft without the user
typing anything (see Extra Ideas below).

### Bundled Swift sidecar architecture

Native SCK and CoreAudio APIs are not available in the Electron renderer or the Node.js
main process. The sidecar is a separate, bundled, notarized Swift executable that lives
in `apps/desktop/native/capture-sidecar/`.

```
Electron main process
  └─ spawns capture-sidecar (stdio or local Unix socket)
       ├─ ScreenCaptureKit stream → AVAssetWriter (fMP4 ring buffer)
       ├─ CoreAudio mic input → AVAssetWriterInput
       ├─ NSWorkspace + AXUIElement → metadata.json
       └─ responds to IPC: { start, stop, save_last_n_min, status }
```

The sidecar is the only process that holds the Screen Recording entitlement and the
mic entitlement. The renderer never touches these APIs. This keeps signing risk isolated:
if the sidecar fails notarization or causes an entitlement regression, it can be stripped
without touching the main app bundle.

Electron main spawns the sidecar with `child_process.spawn` and communicates via a
local Unix socket (`/tmp/needle-capture.sock`) or stdio. The IPC protocol is a simple
JSON line-delimited protocol:

```
→ { "cmd": "start", "maxMinutes": 5 }
← { "status": "recording" }
→ { "cmd": "save_last_n_min", "minutes": 5 }
← { "status": "saved", "path": "/Users/ofer/Documents/Needle/2026-05-31T15:03.mp4" }
→ { "cmd": "stop" }
← { "status": "stopped" }
```

The sidecar is the reference implementation target for WP-B8.

---

## Privacy Stance (NON-NEGOTIABLE)

The Microsoft Recall disaster is the definitive cautionary tale: Recall v1 stored screenshots
in a plaintext SQLite database any local process could read, was called "a keylogger built into
the OS" by researcher Kevin Beaumont, and was pulled pre-launch after mass backlash. It was
redesigned with strict opt-in, BitLocker encryption at rest, a VBS secure enclave, and a
Windows Hello biometric gate — and even then critics found the sensitive-content filter leaky.
Needle must not repeat any of those mistakes, and it has an additional advantage: it captures
only a short rolling window around an explicit user-triggered transition, not everything, all
the time.

**Rewind.ai** (now Limitless, acquired by Meta) was the macOS analog: always-on local screen
capture with an on-device index. The EFF audited it in September 2024 and found no privacy
leaks in simulated attacks — the local-only model is achievable. But Meta acquired Limitless
and disabled all capture on 2025-12-19. That creates a gap; Needle should own a narrow slice
of it (transition storytelling, not total recall).

**screenpipe** (rewind.sh) is the OSS heir and the reference implementation to study.

### Non-negotiable defaults

| Requirement | Implementation |
|---|---|
| **Opt-in only** | The time-machine buffer is disabled by default; the user enables it in settings with a clear explanation of what is captured |
| **Encrypted at rest** | Buffer segments and saved clips are AES-256 encrypted (macOS Data Protection, `NSFileProtectionCompleteUnlessOpen`) |
| **OS-auth to view** | Accessing saved clips (scrub overlay, AI summary) requires Touch ID / macOS authentication via `LocalAuthentication` |
| **Per-app/site exclusion** | Uses `SCContentFilter` to exclude windows from capture; user-configurable list (defaults: 1Password, keychain, banking) |
| **Visible recording indicator** | A persistent, non-dismissible status-bar icon (red dot) is shown whenever the buffer is active; no background recording without indicator |
| **One-tap pause** | A global hotkey and a menu-bar affordance pause the buffer immediately; pausing should feel trivially easy |
| **Local-only** | Buffer segments, metadata, and saved clips never leave the device; no sync, no cloud, no analytics pipeline |
| **Narrow window only** | The buffer is NOT a total-recall system; it runs only when the user has enabled it and holds at most the configured window (5–15 min); old segments are deleted on eviction |
| **No capture-everything default** | Even with the feature enabled, capture runs only during active computer use; the user can set a schedule (e.g. "only 9AM–6PM") |

---

## Permissions & Entitlements

The time-machine feature requires three OS permissions, each with graceful degradation if denied.

| Permission | Why | Entitlement | Graceful degradation |
|---|---|---|---|
| **Screen Recording** | The ScreenCaptureKit stream | `com.apple.security.screen-recording` (sidecar only) | Feature is unavailable; UI surfaces a "Screen Recording needed" settings shortcut |
| **Microphone** | Voice narration in the buffer and Part A transcription | `NSMicrophoneUsageDescription` + `com.apple.security.device.microphone` | Buffer records screen only (no voice); Part A fallback to text-only |
| **Accessibility** | Browser URL, selection, cursor context in metadata | `NSAccessibilityUsageDescription` + AX permission grant | Metadata omits URL/selection; summary quality degrades gracefully; never blocks the dump flow |

**How to request (Electron):**

```typescript
// Screen Recording (check before spawning sidecar)
import { systemPreferences } from 'electron'
const status = systemPreferences.getMediaAccessStatus('screen')
// 'not-determined' → prompt via sidecar CGRequestScreenCaptureAccess()
// 'denied' → open System Settings: Privacy → Screen Recording

// Microphone
const micStatus = await systemPreferences.askForMediaAccess('microphone')

// Accessibility — no Electron API; sidecar uses:
// AXIsProcessTrustedWithOptions({ kAXTrustedCheckOptionPrompt: true })
```

**Entitlement policy (D8):** The sidecar's entitlements are added only when WP-B8 is
actively spiked, after explicit owner sign-off. The main `apps/desktop` entitlements file
and `forge.config.ts` are not touched until that point. This protects the main app's
notarization path.

---

## Extra Ideas (Brainstorm)

These are candidates for future consideration, not commitments. They are recorded here
so they are not lost, not to expand the scope of WP-B8.

**Auto-dump on detected context switch or meeting join**
When the meeting-awareness module (DOC-A5 / WP-B9) detects a meeting join, or when
a large context switch is inferred from app-switching patterns, Needle can proactively
offer to save the last N minutes as the brain dump. No user action required — the
buffer was already running.

**AI pre-fill: summarize the last N minutes into a draft dump**
The metadata timeline (app, URL, file, text selection) is structurally rich enough for
an AI to generate a useful first draft: "You were looking at GitHub issue #42 in Chrome,
then edited `src/model/transition.ts` in VS Code. Looks like you were debugging the
`deriveTransitionBlocks` return type." The user sees this as an editable textarea — the
scary blank box becomes an editing task, which is dramatically easier for ADHD brains.

**"What was I doing?" recovery**
Explicit entry point in the app: "I got interrupted and lost my thread." Opens the
scrub overlay for the last buffer window, even outside a transition. One of the most
painful ADHD experiences is losing the thread after an interruption; this addresses it
directly without requiring the user to have remembered to set anything up in advance.

**Bookmark-this-moment hotkey**
A global hotkey (default `Cmd+Shift+M`) marks the current instant in the buffer. The
bookmark is visible in the scrub overlay as a colored pin. At dump time, the user can
jump to bookmarked moments rather than scrubbing the full timeline. This is especially
useful for "I figured it out right before the meeting" moments.

**Output adapters**
One captured story → multiple output formats, generated by AI, all user-editable before
sending:
- Git commit message ("fix: resolved NaN in deriveCountdown when no anchors")
- Standup update ("Yesterday: fixed the countdown NaN. Today: wiring the overlay.")
- Slack recap ("Quick update on the transition engine — here's what landed:")
- Task notes attached to the linked `Item`

**"Rewind to the bug" → attach clip to task**
In the scrub overlay, the user selects a span (e.g. 2 minutes from 8 minutes ago),
clips it, and attaches it directly to a task item. The attachment is a local `.mp4`
reference, not uploaded anywhere. Useful for bug evidence, design discussions, code
review context.

**Searchable OCR index (future, separate WP)**
Run Vision framework OCR over buffer frames in the background to build a local
full-text index. "Find when I was looking at the billing spec" → jumps to timestamp.
This is a separate, later work package — do not conflate with WP-B8.

---

## Phasing

| Phase | What | Status | WP |
|---|---|---|---|
| **Now** | Simple brain dump: `BrainDump.tsx` (already in `@needle/ui-web`) fed by `deriveTransitionBlocks`, wrapped in the unified `TransitionOverlay`. Text-only, optional voice-transcribe-and-discard. | Buildable today — no new entitlements | WP-B3 + WP-B4 |
| **Spike (flagged, disabled by default)** | Part B: Swift sidecar, ScreenCaptureKit ring buffer, metadata capture, scrub overlay, save flow, AI pre-fill | Requires owner sign-off before entitlement changes; off by default; isolated in `apps/desktop/native/` | WP-B8 |
| **Future (separate WP)** | OCR index, output adapters, "rewind to the bug", search | Not scoped; candidate for a later cycle | — |

> **Rule:** no changes to `apps/desktop/native/`, entitlements, or `forge.config.ts` without
> explicit sign-off from Ofer or Omri. Feature flag must be `false` in all non-development
> builds until the spike is fully validated.
