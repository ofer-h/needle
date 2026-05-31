import { alertStylePool } from '../model/countdown';
import type { NotificationConfig } from '../model/notify';
import { Checkbox } from '../primitives';
import './NotificationSettings.css';

const LEAD_OPTIONS = [30, 15, 10, 5, 1] as const;

type Props = {
  config: NotificationConfig;
  onChange: (next: NotificationConfig) => void;
};

export function NotificationSettings({ config, onChange }: Props) {
  function toggleLead(minutes: number) {
    const has = config.leadMinutes.includes(minutes);
    const next = has
      ? config.leadMinutes.filter((m) => m !== minutes)
      : [...config.leadMinutes, minutes].sort((a, b) => b - a);
    onChange({ ...config, leadMinutes: next });
  }

  function handleQuietStart(value: string) {
    const end = config.quietHoursEnd;
    onChange({
      ...config,
      ...(value ? { quietHoursStart: value } : {}),
      ...(end ? { quietHoursEnd: end } : {}),
    });
  }

  function handleQuietEnd(value: string) {
    const start = config.quietHoursStart;
    onChange({
      ...config,
      ...(start ? { quietHoursStart: start } : {}),
      ...(value ? { quietHoursEnd: value } : {}),
    });
  }

  function toggleRotatingStyle(id: string) {
    const has = config.rotatingStyleIds.includes(id);
    const next = has
      ? config.rotatingStyleIds.filter((s) => s !== id)
      : [...config.rotatingStyleIds, id];
    onChange({ ...config, rotatingStyleIds: next });
  }

  return (
    <div className="ns">
      {/* Lead times */}
      <section className="ns__section">
        <span className="ns__eyebrow">Lead times</span>
        <p className="ns__caption">Nudge me before a hard stop.</p>
        <div className="ns__chips" role="group" aria-label="Lead time nudges">
          {LEAD_OPTIONS.map((min) => {
            const on = config.leadMinutes.includes(min);
            return (
              <button
                key={min}
                type="button"
                className={`ns__chip${on ? ' ns__chip--on' : ''}`}
                aria-pressed={on}
                onClick={() => toggleLead(min)}
              >
                {min}<span className="ns__chip-unit">min</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="ns__divider" role="separator" />

      {/* Quiet hours */}
      <section className="ns__section">
        <span className="ns__eyebrow">Quiet hours</span>
        <p className="ns__caption">No nudges between these times. Leave both blank to disable.</p>
        <div className="ns__time-row">
          <label className="ns__time-label">
            <span className="ns__time-text">From</span>
            <input
              type="time"
              className="ns__time-input"
              value={config.quietHoursStart ?? ''}
              onChange={(e) => handleQuietStart(e.target.value)}
            />
          </label>
          <label className="ns__time-label">
            <span className="ns__time-text">To</span>
            <input
              type="time"
              className="ns__time-input"
              value={config.quietHoursEnd ?? ''}
              onChange={(e) => handleQuietEnd(e.target.value)}
            />
          </label>
        </div>
      </section>

      <div className="ns__divider" role="separator" />

      {/* Alert rotation */}
      <section className="ns__section">
        <span className="ns__eyebrow">Alert rotation</span>
        <p className="ns__caption">
          Which treatments rotate so alerts never get stale.
        </p>
        <ul className="ns__style-list" role="list">
          {alertStylePool.map((style) => {
            const on = config.rotatingStyleIds.includes(style.id);
            return (
              <li key={style.id} className="ns__style-row">
                <span
                  className="ns__swatch"
                  aria-hidden="true"
                  style={{ background: `var(--${style.color})` }}
                />
                <span className="ns__style-id">{style.id}</span>
                <span className="ns__style-intensity">intensity {style.intensity}</span>
                <Checkbox
                  checked={on}
                  onToggle={() => toggleRotatingStyle(style.id)}
                  label={`Include ${style.id} in rotation`}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <div className="ns__divider" role="separator" />

      {/* Sound + Brain-dump */}
      <section className="ns__section ns__section--row">
        <div className="ns__check-row">
          <Checkbox
            checked={config.sound}
            onToggle={() => onChange({ ...config, sound: !config.sound })}
            label="Play a sound"
          />
          <span className="ns__check-label">Play a sound</span>
        </div>
        <div className="ns__check-row">
          <Checkbox
            checked={config.brainDumpHelp}
            onToggle={() => onChange({ ...config, brainDumpHelp: !config.brainDumpHelp })}
            label="Offer brain-dump help at transitions"
          />
          <span className="ns__check-label">Offer brain-dump help at transitions</span>
        </div>
      </section>
    </div>
  );
}
