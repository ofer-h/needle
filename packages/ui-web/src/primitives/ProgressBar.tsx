import './ProgressBar.css';

type ProgressBarProps = {
  value: number;
  max: number;
  tone?: 'upcoming' | 'accent' | 'urgent';
  label?: string;
};

/** Thin progress track. Clamps to [0, max]; width is the done fraction. */
export function ProgressBar({ value, max, tone = 'upcoming', label }: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={`ds-progress ds-progress--${tone}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <span className="ds-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
