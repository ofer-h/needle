import { useMemo, type CSSProperties } from 'react';
import {
  deriveCountdown,
  formatCountdown,
  nextHardStop,
  type CountdownState,
  type NotificationConfig,
  type TodayItemView,
} from '../model';
import { Icon } from '../primitives';
import './Countdown.css';

type CountdownVariant = 'inline' | 'floating' | 'badge';

type CountdownProps = {
  views: TodayItemView[];
  now: Date;
  config?: NotificationConfig;
  variant?: CountdownVariant;
};

/** Time band → rotation seed. Each 5-minute step picks a different eligible
 * style, so the treatment visibly changes as the deadline nears (and as the
 * scenario clock fast-forwards) — the anti-habituation mechanism. */
function seedFor(minutes: number): number {
  return Math.max(0, Math.floor(minutes / 5));
}

export function Countdown({ views, now, variant = 'inline' }: CountdownProps) {
  const state = useMemo<CountdownState | null>(() => {
    const stop = nextHardStop(views, now);
    if (!stop) return null;
    const rawMinutes = Math.round((stop.at.getTime() - now.getTime()) / 60000);
    return deriveCountdown(stop, now, seedFor(rawMinutes));
  }, [views, now]);

  if (!state) {
    if (variant === 'inline') {
      return (
        <span className="cd cd--empty">
          <Icon name="clock" size={13} tone="muted" /> No hard stops ahead
        </span>
      );
    }
    return null;
  }

  const { hardStop, minutesRemaining, urgency, alert } = state;
  const label = formatCountdown(minutesRemaining);
  const motionClass = alert.motion === 'none' ? '' : ` cd--${alert.motion}`;
  const style = {
    '--cd-accent': `var(--${alert.color})`,
    '--cd-scale': String(alert.scale),
  } as CSSProperties;

  if (variant === 'badge') {
    return (
      <div className={`cd-badge${motionClass}`} style={style} aria-label={`${label} to ${hardStop.title}`}>
        <span className="cd-badge__icon">N</span>
        <span className="cd-badge__bubble">{minutesRemaining <= 0 ? '!' : minutesRemaining}</span>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={`cd-float cd-float--${urgency}${motionClass}`} style={style} role="status">
        <div className="cd-float__time">{label}</div>
        <div className="cd-float__meta">
          <span className="cd-float__arrow">→</span> {hardStop.title}
        </div>
        {hardStop.leaveByMinutes ? (
          <div className="cd-float__prep">leave {hardStop.leaveByMinutes}m early</div>
        ) : null}
      </div>
    );
  }

  // inline
  return (
    <span className={`cd cd--${urgency}${motionClass}`} style={style} role="status">
      <Icon name="clock" size={13} tone="inherit" />
      <strong className="cd__time">{label}</strong>
      <span className="cd__arrow">→</span>
      <span className="cd__title">{hardStop.title}</span>
    </span>
  );
}
