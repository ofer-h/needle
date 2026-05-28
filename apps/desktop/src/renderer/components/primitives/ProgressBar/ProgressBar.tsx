import './ProgressBar.css';

type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  width?: number;
  tone?: 'default' | 'urgent' | 'upcoming';
};

/** Linear progress bar. Renders accessibly as `<progress>` semantics via aria. */
export function ProgressBar({
  value,
  max = 100,
  label,
  width,
  tone = 'default',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const pct = max > 0 ? (clamped / max) * 100 : 0;
  const widthStyle = width !== undefined ? { width } : undefined;
  return (
    <span
      className={`ds-progress ds-progress--${tone}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      {...(label ? { 'aria-label': label } : {})}
      {...(widthStyle ? { style: widthStyle } : {})}
    >
      <span className="ds-progress__fill" style={{ width: `${pct}%` }} />
    </span>
  );
}
