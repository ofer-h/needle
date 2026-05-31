# macOS Accessibility & Storytelling Capture Specification

This specification documents the research and architecture for implementing **ADHD Storytelling Capture**, **Meeting Tracking**, and a **"Time Machine" screen buffer** on macOS using native system APIs and Electron integration.

---

## 1. Meeting Detection & Tracking

To help ADHD users combat time blindness, Needle needs to know when they actually join a meeting (Google Meet, Zoom, MS Teams, Slack calls) to automate transition triggers without requiring manual check-ins.

### A. Accessibility API (`AXUIElement` / `AXObserver`)
* **How it works:** macOS allows apps with Accessibility permissions to observe and query the user interface tree of other applications.
* **Mechanism:**
  1. Detect if the active window belongs to a web browser (Chrome, Safari, Firefox, Arc) or a desktop client (Zoom, Teams, Slack).
  2. Periodically query the browser's accessibility tree to find the **Address Bar** (`AXAddressBar` or `AXTextField` with value matching a URL pattern).
  3. Detect URL prefixes:
     - Google Meet: `meet.google.com/*`
     - Zoom: `*.zoom.us/j/*`, `*.zoom.us/s/*`
     - MS Teams: `teams.microsoft.com/l/meetup-join/*`
  4. For desktop clients like Zoom, look for active windows with titles containing "Zoom Meeting" or buttons in the AX tree named "Mute", "Unmute", or "Leave Meeting".
* **macOS Permission:** Requires **Accessibility (AX)** permission. The app can trigger a request using:
  ```swift
  let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
  let isTrusted = AXIsProcessTrustedWithOptions(options as CFDictionary)
  ```

### B. Microphone/Camera Stream Sensing
* **How it works:** macOS CoreAudio publishes notifications when a process opens a microphone stream.
* **Mechanism:**
  1. Monitor active audio inputs via the **CoreAudio HAL (Hardware Abstraction Layer)**.
  2. Query `kAudioDevicePropertyDeviceIsRunningSomewhere` or `kAudioDevicePropertyDeviceInputIsActive` on the default input device.
  3. When an input stream becomes active, query the active PIDs utilizing the stream. Cross-reference these PIDs with known meeting clients or web browsers.
  4. CoreAudio is extremely lightweight, respects privacy, and does not require full screen-recording permissions to detect *if* a device is capturing audio.

### C. Workspace Window Monitoring
* **How it works:** The `Quartz Window Services` API provides snapshots of active windows.
* **Mechanism:**
  1. Run `CGWindowListCopyWindowInfo` to list open windows.
  2. Filter by owner applications: `us.zoom.xos`, `com.microsoft.teams`, `com.tinyspeck.slack`.
  3. Check window sizes and titles. If Zoom has a window larger than a specific threshold that is active, a call is underway.

---

## 2. ADHD Storytelling Capture (Screen + Voice Recording)

ADHD users often find writing structured status updates extremely taxing. The **Storytelling Capture** feature allows users to record a quick screen video while speaking, describing what they just built or where they got stuck.

### A. Performing Screen Recording with `ScreenCaptureKit`
* **Technology:** **ScreenCaptureKit (SCK)** (macOS 12.3+) is Apple's high-performance framework for screen capture.
* **Advantages:**
  - Zero-copy hardware accelerated frame capturing.
  - Can isolate a single application window (e.g. VS Code or browser only) so private desktop notifications are not captured.
  - Captures system audio (output) and microphone audio simultaneously.
* **Implementation:**
  1. Request screen recording permission using `CGRequestScreenCaptureAccess()`.
  2. Query available displays and windows using `SCShareableContent.getShareableContent`.
  3. Create an `SCStreamConfiguration` (set width, height, frame rate e.g., 15fps is plenty for static code, and enable microphone capture).
  4. Direct frames to an `AVAssetWriter` configured with `VTCompressionSession` (using hardware H.264/HEVC encoding) to minimize CPU overhead.

### B. Mouse Coordinate Tracking & Highlight Overlays
* **Mechanism:**
  1. Listen to global mouse events in the main/preload script:
     ```javascript
     NSEvent.addGlobalMonitorForEvents(matching: .mouseMoved) { event in
         let pos = event.locationInWindow // or CGEvent.location
         // broadcast mouse position to transparent Electron highlight overlay
     }
     ```
  2. Launch a fully transparent click-through Electron window overlaying the entire screen (`setIgnoreMouseEvents(true)`).
  3. When the user clicks or presses a key modifier (e.g. `Cmd`), render a beautiful, pulsing circular ring (using SVG/CSS canvas) around the mouse coordinates to highlight a button or piece of code.
  4. Capture this visual ring directly on the recorded video stream or let the overlay guide the user's attention.

### C. Active App & Element Metadata Capture (Rich Timeline)
* **Objective:** Automatically attach context like "active file", "git branch", or "URL clicked" to the video recording timeline.
* **Mechanism:**
  1. Periodically query the frontmost application:
     ```swift
     let frontApp = NSWorkspace.shared.frontmostApplication
     let bundleURL = frontApp?.bundleURL?.path
     ```
  2. If the app is Chrome/Safari, use AXUIElement to extract the active URL.
  3. If the app is VS Code, fetch the active workspace file path using accessibility or a simple local socket connection to a lightweight VS Code extension.
  4. Write these metadata events (e.g. `timestamp: 12.4s, app: Chrome, url: https://github.com/issues`) into a structured JSON file alongside the recording.
  5. The AI agent parses this timeline to generate a rich, accurate markdown summary: *"Ofer spent 2 minutes looking at the Billing spec in Chrome, then switched to VS Code to edit index.tsx."*

---

## 3. "Time Machine" Screen Buffer (Continuous 5-10m Capture)

ADHD brains are highly susceptible to hyperfocus and time blindness. A user might work for 30 minutes, solve a complex bug, and have no memory of the steps they took. The **Time Machine** background buffer runs continuously, allowing the user to "scroll back in time" to capture what they just did.

### A. Circular/Rolling Buffer in Memory or Temporary Files
* **Core Problem:** Continuous recording consumes disk space and drains battery if not optimized.
* **Architecture:**
  1. Capture the screen at **5fps** with low resolution (e.g. 720p) to keep bitrates around `500kbps`. A 10-minute buffer is only `37.5MB`.
  2. Encode video frames directly into **5-second fragmented MP4 (fMP4) chunks** using hardware acceleration.
  3. Keep a rolling list of these file paths in memory. When the list exceeds 120 chunks (10 minutes), delete the oldest chunk from disk and remove it from the list.
* **Low Impact:** SCK + H.264 hardware encoding consumes `<2%` CPU and negligible power on modern Apple Silicon.

### B. Scroll-back "Context Stashing" Trigger
1. The user triggers the **Time Machine** from the menu bar or a hotkey (`Cmd+Shift+T`).
2. A beautiful, sleek glassmorphic scrubber overlay appears, displaying a timeline of the last 10 minutes.
3. The user can scrub through the frames to see what they were doing.
4. They select a 2-minute segment (e.g., from 4 minutes ago to 2 minutes ago).
5. The app instantly merges the corresponding 5-second video chunks into a single clip using `FFmpeg` (fast stream-copy, no re-encoding required).
6. The user records a 30-second voice-over explaining their breakthrough.
7. Needle's AI structures this into an auto-documented commit message, task update, or Slack recap!
