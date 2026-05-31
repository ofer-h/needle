# Meeting Awareness

> Status: design/spec for a future flagged track (WP-B9). Detection only, off by
> default. No code yet.

**Parent plan:** [needle-next-master-plan.md](needle-next-master-plan.md) §7 DOC-A5.
**Cross-reference:** [../superpowers/specs/2026-05-31-macos-accessibility-capture.md](../superpowers/specs/2026-05-31-macos-accessibility-capture.md) §1 — meeting detection research (Accessibility API, CoreAudio HAL, CGWindowListCopyWindowInfo) that this doc formalises.

---

## Contents

- [What This Is and Is Not](#what-this-is-and-is-not)
- [Detection Signals](#detection-signals)
- [Confidence Model](#confidence-model)
- [Permission UX](#permission-ux)
- [Uses Within Needle](#uses-within-needle)
- [Privacy](#privacy)
- [Architecture Notes](#architecture-notes)
- [Phasing](#phasing)

---

## What This Is and Is Not

Meeting awareness answers one narrow question: **has the user actually joined a meeting right now?**

It does not:
- Record, transcribe, or summarise meeting content (that is a separate product category — see Granola, Otter, Fathom)
- Require calendar access (though calendar events are the upstream anchors that trigger transitions)
- Require a meeting bot or any network integration

It does:
- Detect, with reasonable confidence, that a video/audio call is live on this machine
- Emit a structured signal the transition engine can act on
- Degrade gracefully when permissions are denied

The use of this signal inside Needle is limited to two things: accountability (did you
arrive on time?) and transition softening (don't interrupt someone who is already in the
meeting). Both are described in [Uses Within Needle](#uses-within-needle).

---

## Detection Signals

No single signal is sufficient. Meeting awareness is a weighted combination of the four
signals below. The more that agree, the higher the confidence.

### Signal 1 — Microphone or camera in use (CoreAudio / CoreMediaIO)

The most reliable passive indicator that a call is live is that *something* is actively
reading from the microphone or camera.

**Microphone:**
Query `kAudioDevicePropertyDeviceIsRunningSomewhere` on the default input device via the
CoreAudio HAL. This boolean is `true` whenever any process has an open input stream.
To identify the calling process, enumerate PIDs using
`kAudioDevicePropertyDeviceInputIsActive` and cross-reference against known meeting
client bundle IDs (see Signal 2).

```swift
var isRunning: UInt32 = 0
var propAddress = AudioObjectPropertyAddress(
    mSelector: kAudioDevicePropertyDeviceIsRunningSomewhere,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain
)
AudioObjectGetPropertyData(defaultInputDevice, &propAddress, 0, nil,
    &dataSize, &isRunning)
```

**Camera:**
`CoreMediaIO` (CMIO) publishes `CMIOObjectPropertyDeviceIsRunningSomewhere` on the
default capture device. The same cross-referencing approach applies.

CoreAudio and CoreMediaIO do not require Screen Recording permission. They tell you
whether a device is in use, not what is being said or shown.

### Signal 2 — Frontmost application (NSWorkspace)

```swift
let frontApp = NSWorkspace.shared.frontmostApplication
let bundleID = frontApp?.bundleIdentifier ?? ""
```

Known meeting-client bundle IDs to match against:

| App | Bundle ID |
|---|---|
| Zoom (native) | `us.zoom.xos` |
| Microsoft Teams | `com.microsoft.teams`, `com.microsoft.teams2` |
| Slack | `com.tinyspeck.slackmacgap` |
| Google Chrome | `com.google.Chrome` *(needs URL signal to confirm)* |
| Safari | `com.apple.Safari` *(needs URL signal to confirm)* |
| Arc | `company.thebrowser.Browser` *(needs URL signal to confirm)* |
| Firefox | `org.mozilla.firefox` *(needs URL signal to confirm)* |
| Webex | `Cisco-Systems.Spark` |
| FaceTime | `com.apple.FaceTime` |

For browser bundle IDs, Signal 2 alone is insufficient — a browser is just open, not
necessarily in a meeting. Signal 3 (URL) disambiguates.

### Signal 3 — Browser URL heuristics (Accessibility API)

When the frontmost app is a browser, query its address bar via `AXUIElement`:

```swift
let appRef = AXUIElementCreateApplication(browserPID)
// navigate: AXFocusedUIElement → AXWindow → AXToolbar → AXAddressBar (or AXTextField)
var urlValue: CFTypeRef?
AXUIElementCopyAttributeValue(addressBar, kAXValueAttribute as CFString, &urlValue)
let urlString = urlValue as? String ?? ""
```

URL patterns that indicate an active meeting:

| Service | URL pattern |
|---|---|
| Google Meet | `meet.google.com/[a-z]{3}-[a-z]{4}-[a-z]{3}` |
| Zoom (web) | `*.zoom.us/j/[0-9]+` or `*.zoom.us/s/[0-9]+` |
| Microsoft Teams | `teams.microsoft.com/l/meetup-join/` |
| Webex (web) | `*.webex.com/meet/` |
| Around | `meet.around.co/` |
| Luma / Hopin | Less stable; skip for now |

Being on the meeting URL is a strong positive signal but not conclusive alone — the
user might be on the waiting room or have the tab backgrounded while they are not yet
in the call. Combine with Signal 1 (mic/cam in use) for high confidence.

### Signal 4 — Accessibility tree buttons (join confirmation)

For native meeting clients (Zoom, Teams, Slack) and browser-based meetings, the presence
of specific UI controls is a strong in-meeting indicator:

- Zoom native: AX button with title "Mute" or "Unmute", and/or "Leave Meeting"
- Teams: AX button with title "Mute" / "React" / "Leave"
- Google Meet (in browser): AX button labelled "Turn off microphone" or "Leave call"
- Slack Huddle: AX button with title "Leave huddle"

This signal is the most precise but also the most brittle — app updates rename buttons.
Treat it as a confirming signal when it is present, not as a required one when absent.

Signal 4 requires the Accessibility permission.

---

## Confidence Model

| Confidence | Condition |
|---|---|
| **High (call is live)** | Signal 1 (mic/cam active) AND (Signal 2 matches a native client OR Signal 3 matches a meeting URL) |
| **Medium** | Signal 2 matches a native client AND Signal 4 (in-meeting buttons present) but Signal 1 not confirmed |
| **Low** | Only Signal 3 (meeting URL open in browser) with no mic/cam activity |
| **Not in meeting** | None of the above |

The engine emits one of `{ not_detected, low, medium, high }`. The transition system
uses `high` or `medium` as the threshold for softening an interrupt. `low` alone is not
enough — it likely means the user has the meeting tab open but has not yet joined.

Polling interval: every 5 seconds is sufficient. This is not a real-time streaming
API — a 5-second latency is acceptable for all intended uses.

---

## Permission UX

Two permissions are required for full detection. Neither is required for the feature to
be useful at all — each degrades gracefully.

| Permission | Used for | Graceful degradation |
|---|---|---|
| **Accessibility** | Signal 3 (URL from address bar), Signal 4 (meeting buttons) | Detection falls back to Signal 1 + Signal 2 only (still useful for native clients) |
| **Microphone access status** | Reading CoreAudio mic-in-use state | Note: Needle does NOT record audio; it only queries whether *some other app* is currently using the microphone. This requires `NSMicrophoneUsageDescription` in the Info.plist but no active recording permission prompt on macOS 12+. |

**Requesting permissions in Electron:**

```typescript
import { systemPreferences } from 'electron'

// Microphone access status (read-only check, no recording)
const micStatus = systemPreferences.getMediaAccessStatus('microphone')
// 'granted' → can query CoreAudio in-use state
// 'not-determined' → request when the feature is first enabled
// 'denied' → suggest System Settings path; degrade to Signal 2/3 only

// Accessibility: no Electron API
// The sidecar requests via AXIsProcessTrustedWithOptions at first launch
```

**When to request:** Only when the user explicitly enables the meeting-awareness feature
in settings. Do not request on app launch. Explain what the permission is used for in
plain language before the system prompt appears:

> "To detect when you've joined a meeting, Needle checks whether your microphone is in
> use and reads the URL in your browser. It never records audio or video."

**Denied-permission UX:** If Accessibility is denied, show a non-blocking banner in
settings: "Meeting URL detection is off. Needle can still detect meetings via the
microphone signal if you grant microphone access." Never block the app on a denied
permission.

---

## Uses Within Needle

### 1. Accountability: on-time arrival

The transition system tracks whether a brain dump was completed before the anchor time
(the `leave_by` or the event start). Meeting awareness adds a third data point:
**did the user actually join within N minutes of the start time?**

This feeds into `coach.ts` (`Adherence`) as a new outcome kind: `joined_on_time`.
The accountability modes (gamified / coached / self) can surface this calmly:
"You joined the 3PM stand-up 2 minutes in" or, gently, "You joined 8 minutes late —
want to set an earlier brain-dump next time?"

This is a positive reinforcement affordance, not a nag. The default phrasing is
always congratulatory for on-time arrivals and non-judgmental for late ones.

### 2. Softening or cancelling a transition interrupt

If the user is already in the meeting when the transition overlay would normally fire,
the overlay should not interrupt them. This is the primary motivation for detection.

Behaviour:

| Situation | Action |
|---|---|
| High-confidence meeting detected, `brain_dump` block has not started yet | Suppress the transition interrupt entirely; log the anchor as `auto_skipped: in_meeting`; surfaces as a quiet nudge afterwards: "You were already in the 3PM stand-up — your notes are ready when you exit." |
| Meeting detected mid-sequence (during break or prep block) | Fold remaining blocks; close the overlay silently |
| Meeting detected after `brain_dump` block completed | Proceed normally; the dump already happened |
| Only `low` confidence | Do not suppress; fire the transition normally |

The suppression decision is made by `deriveTransitionBlocks()` when given the meeting
signal as an input, keeping the logic pure and testable. The sidecar emits the signal
over IPC; Electron main passes it to the engine on each poll.

---

## Privacy

Meeting awareness is detection-only. It never captures audio, video, or screen content.
It never communicates with any external service. All signals are read locally and
discarded after the confidence verdict is computed.

| Property | Value |
|---|---|
| Data captured | None. Only a boolean verdict (`not_detected` / `low` / `medium` / `high`) and a timestamp |
| Audio recording | No. CoreAudio is queried for device-in-use state only |
| Video recording | No |
| Network calls | None |
| Stored data | Only the `Adherence` outcome (`joined_on_time` / `auto_skipped`) linked to the anchor `Item` — same as other transition outcomes |
| Enabled by default | No. User enables explicitly in settings |
| Disable instantly | Toggle in settings; polling stops within one interval (5 s) |

The sensitivity of this approach is low: we are asking "is a microphone open?" and
"does the browser URL match a known pattern?" — not "what is being said?" Granola,
Otter, and Fathom tap the system audio stream to transcribe meetings; Needle does
none of that.

---

## Architecture Notes

The detection logic runs in the Swift sidecar (same executable as the capture sidecar
described in [brain-dump-and-time-machine.md](brain-dump-and-time-machine.md)), or as
a lighter standalone helper if WP-B9 is spiked independently. The reasons are the same:
native CoreAudio and Accessibility APIs are not available in the Node.js / Electron
runtime, and isolating them in a signed helper keeps the main app's entitlement surface
clean.

IPC protocol over the local Unix socket:

```
→ { "cmd": "start_meeting_poll", "intervalSeconds": 5 }
← { "status": "polling" }
// every 5 seconds:
← { "type": "meeting_status", "confidence": "high", "signals": ["mic", "url"],
    "bundleId": "us.zoom.xos", "url": null }
→ { "cmd": "stop_meeting_poll" }
← { "status": "stopped" }
```

The `signals` array indicates which of the four signals contributed to the verdict,
useful for debugging.

Electron main subscribes to these events and updates a live `MeetingState` atom in the
renderer store. The transition engine reads `MeetingState.confidence` as part of its
inputs — keeping the suppression logic in the pure `deriveTransitionBlocks()` function
rather than scattered across effects.

---

## Phasing

| Phase | What | Status | WP |
|---|---|---|---|
| **Now (no code)** | This document. Spec is written; detection logic is understood. | Design/spec only | DOC-A5 |
| **Spike (flagged, disabled by default)** | Swift sidecar or standalone helper implementing the four-signal confidence model; IPC protocol; Electron main subscription; transition engine `MeetingState` input; accountability `joined_on_time` outcome | Requires owner sign-off; off by default; no entitlement changes to main app | WP-B9 |
| **Integration** | Wire `MeetingState` into `deriveTransitionBlocks()` suppression logic; surface `joined_on_time` in coach/accountability UI | Depends on WP-B9 + WP-B3/B4 | WP-B7 |

> **Rule:** no polling, no entitlement requests, and no `Info.plist` additions until
> WP-B9 is actively spiked with owner sign-off. The feature flag must be `false` in
> all non-development builds.
