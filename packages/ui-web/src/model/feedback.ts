/* Feedback bus — ONE place that maps named app events to sensory cues
 * (sound / haptic / celebration). Open/closed: add an event, map it once here;
 * call sites just `emit('item.completed')`. Gentle defaults, centrally
 * mutable, respects reduced-motion + quiet hours.
 *
 * Pure model + a `FeedbackSink` interface the host implements (studio: Web
 * Audio + a confetti element; desktop: Web Audio + native haptics later). The
 * model never touches the DOM. Promote into @needle/domain once validated. */

export type FeedbackEvent =
  | 'item.added'
  | 'item.completed'
  | 'item.firstCompleted'
  | 'capture.saved'
  | 'ritual.started'
  | 'block.done'
  | 'hard_stop'
  | 'day.allDone';

export type SoundName = 'tap' | 'complete' | 'chime' | 'success' | 'alert';
export type HapticName = 'light' | 'medium' | 'success' | 'warning';
export type CelebrationName = 'sparkle' | 'fireworks';

export type FeedbackCue = {
  sound?: SoundName;
  haptic?: HapticName;
  celebrate?: CelebrationName;
};

/** Default mapping. Gentle by default; first-completion + all-done celebrate. */
export const DEFAULT_CUES: Record<FeedbackEvent, FeedbackCue> = {
  'item.added': { sound: 'tap', haptic: 'light' },
  'item.completed': { sound: 'complete', haptic: 'success' },
  'item.firstCompleted': { sound: 'success', haptic: 'success', celebrate: 'fireworks' },
  'capture.saved': { sound: 'tap', haptic: 'light' },
  'ritual.started': { sound: 'chime', haptic: 'medium' },
  'block.done': { sound: 'tap', haptic: 'light' },
  hard_stop: { sound: 'alert', haptic: 'warning' },
  'day.allDone': { sound: 'success', celebrate: 'fireworks' },
};

export type QuietHours = { start: string; end: string };

export type FeedbackConfig = {
  enabled: boolean;
  sound: boolean;
  haptics: boolean;
  celebrations: boolean;
  /** Suppress celebrations when the OS prefers reduced motion. */
  respectReducedMotion: boolean;
  /** Mute window, e.g. { start: '22:00', end: '07:00' }; null = always on. */
  quietHours: QuietHours | null;
};

export const defaultFeedbackConfig = (): FeedbackConfig => ({
  enabled: true,
  sound: true,
  haptics: true,
  celebrations: true,
  respectReducedMotion: true,
  quietHours: null,
});

/** The host implements whichever cues it supports; missing ones are skipped. */
export type FeedbackSink = {
  playSound?: (name: SoundName) => void;
  vibrate?: (name: HapticName) => void;
  celebrate?: (name: CelebrationName) => void;
};

export function inFeedbackQuietHours(now: Date, q: QuietHours | null): boolean {
  if (!q) return false;
  const [sh, sm] = q.start.split(':').map(Number);
  const [eh, em] = q.end.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = (sh ?? 0) * 60 + (sm ?? 0);
  const end = (eh ?? 0) * 60 + (em ?? 0);
  return start <= end ? cur >= start && cur < end : cur >= start || cur < end;
}

export type FeedbackBus = {
  emit: (event: FeedbackEvent, now?: Date) => void;
};

export type FeedbackBusOptions = {
  cues?: Partial<Record<FeedbackEvent, FeedbackCue>>;
  prefersReducedMotion?: () => boolean;
};

/** Build a bus. `getConfig` is read on each emit so live settings changes apply
 * without rebuilding. */
export function createFeedbackBus(
  getConfig: () => FeedbackConfig,
  sink: FeedbackSink,
  options: FeedbackBusOptions = {},
): FeedbackBus {
  const cues: Record<FeedbackEvent, FeedbackCue> = { ...DEFAULT_CUES, ...(options.cues ?? {}) };
  return {
    emit(event, now = new Date()) {
      const cfg = getConfig();
      if (!cfg.enabled) return;
      if (inFeedbackQuietHours(now, cfg.quietHours)) return;
      const cue = cues[event];
      if (!cue) return;
      if (cfg.sound && cue.sound && sink.playSound) sink.playSound(cue.sound);
      if (cfg.haptics && cue.haptic && sink.vibrate) sink.vibrate(cue.haptic);
      if (cfg.celebrations && cue.celebrate && sink.celebrate) {
        const reduce = cfg.respectReducedMotion && (options.prefersReducedMotion?.() ?? false);
        if (!reduce) sink.celebrate(cue.celebrate);
      }
    },
  };
}

/** A no-op sink (tests / SSR / feedback fully disabled). */
export const noopFeedbackSink: FeedbackSink = {};
