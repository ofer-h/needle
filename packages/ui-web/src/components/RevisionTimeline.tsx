import type { Revision } from '../model/revision';
import { Button, Icon, Pill } from '../primitives';
import './RevisionTimeline.css';

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Props = {
  revisions: Revision[];
  onUndo: (id: string) => void;
};

export function RevisionTimeline({ revisions, onUndo }: Props) {
  if (revisions.length === 0) {
    return (
      <div className="rtl">
        <p className="rtl__empty">No changes yet. Edits and AI actions will show up here, each one revertible.</p>
      </div>
    );
  }

  return (
    <div className="rtl">
      <ol className="rtl__list">
        {revisions.map((rev) => (
          <li key={rev.id} className={`rtl__row${rev.actor === 'ai' ? ' rtl__row--ai' : ''}${rev.undone ? ' rtl__row--undone' : ''}`}>
            <div className="rtl__badge">
              {rev.actor === 'ai' ? (
                <Pill tone="upcoming" leadingIcon={<Icon name="spark" size={11} tone="inherit" />}>
                  AI
                </Pill>
              ) : (
                <Pill tone="neutral">You</Pill>
              )}
            </div>
            <div className="rtl__body">
              <span className="rtl__summary">{rev.summary}</span>
              <span className="rtl__time">{relativeTime(rev.at)}</span>
            </div>
            <div className="rtl__action">
              {rev.undone ? (
                <span className="rtl__reverted">Reverted</span>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  leadingIcon={<Icon name="undo" size={13} tone="inherit" />}
                  aria-label={`Undo: ${rev.summary}`}
                  onClick={() => onUndo(rev.id)}
                >
                  Undo
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
