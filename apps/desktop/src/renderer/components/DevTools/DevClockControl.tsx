import { useDevClock } from '../../utils/dev-clock';
import './DevClockControl.css';

const PRESET_TIMES = ['09:00', '14:54', '14:55', '14:59', '15:00', '15:01'] as const;

export default function DevClockControl() {
  const frozenIso = useDevClock((s) => s.frozenIso);
  const jumpToTime = useDevClock((s) => s.jumpToTime);
  const setFrozen = useDevClock((s) => s.setFrozen);

  const label =
    frozenIso === null
      ? 'live'
      : new Date(frozenIso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

  return (
    <div className="dev-clock" role="group" aria-label="Developer clock control">
      <div className="dev-clock__row">
        <span className="dev-clock__label">Clock</span>
        <span className="dev-clock__time">{label}</span>
        {frozenIso !== null && (
          <button type="button" className="dev-clock__resume" onClick={() => setFrozen(null)}>
            resume
          </button>
        )}
      </div>
      <div className="dev-clock__row dev-clock__buttons">
        {PRESET_TIMES.map((t) => (
          <button
            key={t}
            type="button"
            className="dev-clock__preset"
            onClick={() => {
              console.info('[DevClock] jump', t);
              jumpToTime(t);
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
