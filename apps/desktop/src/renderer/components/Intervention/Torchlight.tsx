import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import './Torchlight.css';

export type TorchlightProps = {
  active: boolean;
  title: string;
  subtitle: string;
  /** When set, the spotlight is centered on this rect (legacy in-window mode). */
  targetRect: DOMRect | null;
  /** When set, the spotlight is centered on this cursor position with a fixed radius. */
  cursor?: { x: number; y: number; radius?: number } | null;
  /** When false, the dismiss CTA is hidden — used when the host process drives timing. */
  showCta?: boolean;
  /**
   * When false, the title/subtitle card is hidden entirely.
   * Use for ambient torch-overlay mode where no in-window UI should block interaction.
   * Defaults to true.
   */
  cardVisible?: boolean;
  /**
   * When true the escalation interval is paused and intensity is held at a
   * near-zero value so the overlay is barely perceptible while snoozed.
   * Cleared by the parent when a fresh payload arrives after the snooze elapses.
   */
  snoozed?: boolean;
  /** Override the default 30s auto-timeout. Pass 0 to disable. */
  timeoutMs?: number;
  onAcknowledge: () => void;
  onTimeout: () => void;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RADIUS = 200;
const HALO_PADDING = 60;
const RADIUS_FACTOR = 0.8;
const TITLE_ID = 'torchlight-title';
const INTENSITY_TICK_MS = 100; // ~10fps is smooth enough for a slow ambient animation
const SNOOZED_INTENSITY = 0.05; // barely perceptible while snoozed

type SpotlightGeometry = {
  cx: number;
  cy: number;
  radius: number;
};

function computeSpotlight(
  rect: DOMRect | null,
  cursor?: { x: number; y: number; radius?: number } | null,
): SpotlightGeometry {
  if (cursor) {
    return {
      cx: cursor.x,
      cy: cursor.y,
      radius: cursor.radius ?? DEFAULT_RADIUS,
    };
  }
  if (rect === null) {
    return {
      cx: window.innerWidth / 2,
      cy: window.innerHeight / 2,
      radius: DEFAULT_RADIUS,
    };
  }
  return {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
    radius: Math.max(rect.width, rect.height) * RADIUS_FACTOR + HALO_PADDING,
  };
}

export default function Torchlight({
  active,
  title,
  subtitle,
  targetRect,
  cursor,
  showCta = true,
  cardVisible = true,
  snoozed = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onAcknowledge,
  onTimeout,
}: TorchlightProps): JSX.Element | null {
  const onTimeoutRef = useRef(onTimeout);
  const ctaRef = useRef<HTMLButtonElement | null>(null);
  // 0–1 intensity that drives CSS opacity + blur via --torch-intensity.
  const [intensity, setIntensity] = useState(0);
  const mountTimeRef = useRef<number | null>(null);

  // Keep the latest onTimeout reference without resetting the timer when the
  // callback identity changes between renders.
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Auto-timeout. Cleared on unmount, when `active` flips to false,
  // and re-armed if the parent toggles `active` back on.
  useEffect(() => {
    if (!active || timeoutMs <= 0) return;
    const id = window.setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);
    return () => {
      window.clearTimeout(id);
    };
  }, [active, timeoutMs]);

  // Lock background scroll while the overlay is up.
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  // Pull focus to the CTA so Enter / Space acknowledge by default.
  useEffect(() => {
    if (!active) return;
    ctaRef.current?.focus();
  }, [active]);

  // Escalating intensity: ramps from 0 → 1 over timeoutMs using ease-out curve.
  // Paused at SNOOZED_INTENSITY while `snoozed` is true.
  // Cleared when inactive or when timeoutMs is 0 (disabled).
  useEffect(() => {
    if (!active || timeoutMs <= 0) {
      setIntensity(0);
      mountTimeRef.current = null;
      return;
    }
    if (snoozed) {
      setIntensity(SNOOZED_INTENSITY);
      mountTimeRef.current = null;
      return;
    }
    mountTimeRef.current = Date.now();
    setIntensity(0);
    const id = window.setInterval(() => {
      const elapsed = Date.now() - (mountTimeRef.current ?? Date.now());
      const progress = Math.min(1, elapsed / timeoutMs);
      // Ease-out quadratic: fast initial rise → deliberate slow build.
      setIntensity(1 - (1 - progress) * (1 - progress));
    }, INTENSITY_TICK_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [active, timeoutMs, snoozed]);

  if (!active) return null;

  // Explicit `cursor === null` with no targetRect means "off this display" —
  // render uniform dim without a spotlight hole. (Distinct from `cursor === undefined`
  // which falls through to targetRect / viewport-center defaults.)
  const noSpotlight = cursor === null && targetRect === null;
  const { cx, cy, radius } = computeSpotlight(targetRect, cursor);

  // The mask cuts a soft circular hole over the target. The inner stop
  // (0 → 70% of radius) is fully transparent (no scrim, no blur shows there);
  // 70% → 100% is the soft halo edge.
  const maskValue =
    `radial-gradient(circle at ${cx}px ${cy}px, ` +
    `transparent 0px, ` +
    `transparent ${radius * 0.7}px, ` +
    `#000 ${radius}px)`;

  const backdropStyle: CSSProperties = {
    // --torch-intensity drives opacity and blur in CSS.
    ['--torch-intensity' as string]: intensity,
    ...(noSpotlight
      ? {}
      : {
          maskImage: maskValue,
          WebkitMaskImage: maskValue,
        }),
  };

  function handleCtaKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    // Native <button> already triggers click on Enter / Space, but we keep
    // explicit handling to swallow other keys (Escape must not close).
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onAcknowledge();
    }
  }

  return (
    <div className="torchlight">
      <div className="torchlight__backdrop" style={backdropStyle} aria-hidden="true" />

      {cardVisible && (
        <div
          className="torchlight__card"
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
        >
          <h2 id={TITLE_ID} className="torchlight__title t-display">
            {title}
          </h2>
          <p className="torchlight__subtitle">{subtitle}</p>
          {showCta && (
            <button
              ref={ctaRef}
              type="button"
              className="torchlight__cta"
              onClick={onAcknowledge}
              onKeyDown={handleCtaKeyDown}
            >
              I&rsquo;m moving to it
            </button>
          )}
        </div>
      )}
    </div>
  );
}
