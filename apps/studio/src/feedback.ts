/* Browser-side FeedbackSink — Web Audio blips, navigator.vibrate guarded
 * haptics, and a tiny DOM confetti burst. Intentionally self-contained; no
 * external deps beyond the model types. */

import type { CelebrationName, FeedbackSink, HapticName, SoundName } from '@needle/ui-web';

// ── Sound ────────────────────────────────────────────────────────────────────

const SOUND_PITCHES: Record<SoundName, number> = {
  tap: 660,
  complete: 880,
  chime: 1046,
  success: 1320,
  alert: 440,
};

function playBlip(hz: number, durationSec: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine'): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(hz, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationSec);
    osc.onended = () => ctx.close();
  } catch {
    // AudioContext blocked (tab not yet interacted with) — silently skip.
  }
}

function playSound(name: SoundName): void {
  const hz = SOUND_PITCHES[name];
  const isMelodic = name === 'chime' || name === 'success';
  playBlip(hz, isMelodic ? 0.4 : 0.12, isMelodic ? 'sine' : 'square');
}

// ── Haptics ──────────────────────────────────────────────────────────────────

const HAPTIC_PATTERNS: Record<HapticName, number[]> = {
  light: [30],
  medium: [60],
  success: [30, 40, 80],
  warning: [100, 50, 100],
};

function vibrate(name: HapticName): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  const pattern = HAPTIC_PATTERNS[name];
  if (pattern !== undefined) navigator.vibrate(pattern);
}

// ── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];

function launchConfetti(): void {
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:9999;width:100%;height:100%';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    document.body.removeChild(canvas);
    return;
  }
  // ctx is verified non-null from here on; capture in a const for TS flow.
  const draw = ctx;

  type Particle = { x: number; y: number; vx: number; vy: number; color: string; r: number };
  const count = 60;
  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? '#fbbf24',
    r: Math.random() * 5 + 3,
  }));

  let frame = 0;
  const MAX_FRAMES = 90;

  function tick() {
    draw.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      draw.fillStyle = p.color;
      draw.beginPath();
      draw.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      draw.fill();
    }
    frame++;
    if (frame < MAX_FRAMES) {
      requestAnimationFrame(tick);
    } else {
      document.body.removeChild(canvas);
    }
  }

  requestAnimationFrame(tick);
}

function celebrate(name: CelebrationName): void {
  if (name === 'fireworks' || name === 'sparkle') launchConfetti();
}

// ── Public factory ────────────────────────────────────────────────────────────

export function createBrowserFeedbackSink(): FeedbackSink {
  return { playSound, vibrate, celebrate };
}
