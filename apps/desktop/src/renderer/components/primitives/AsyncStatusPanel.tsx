import { Button } from './Button';
import { PENDING_SLOW_THRESHOLD_MS } from '../../hooks/usePendingOperation';
import './AsyncStatusPanel.css';

type Props = {
  label: string;
  detail?: string;
  elapsedMs: number;
  isSlow?: boolean;
  slowMessage?: string;
  onCancel?: () => void;
  cancelLabel?: string;
};

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${Math.round(ms / 100) / 10}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AsyncStatusPanel({
  label,
  detail,
  elapsedMs,
  isSlow = elapsedMs >= PENDING_SLOW_THRESHOLD_MS,
  slowMessage = 'This is taking longer than usual.',
  onCancel,
  cancelLabel = 'Cancel',
}: Props) {
  return (
    <div className="async-status" role="status" aria-live="polite" aria-busy="true">
      <div className="async-status__row">
        <div className="thinking async-status__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span className="async-status__label">{label}</span>
        <span className="async-status__elapsed t-mono">{formatElapsed(elapsedMs)}</span>
      </div>
      {detail !== undefined && detail.length > 0 && (
        <p className="async-status__detail">{detail}</p>
      )}
      {isSlow && <p className="async-status__slow">{slowMessage}</p>}
      {onCancel !== undefined && (
        <div className="async-status__actions">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
