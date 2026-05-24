import { IconCheck } from '../Icons';

type Props = {
  kind?: 'urgent' | 'upcoming' | 'faded';
  label: string;
  sublabel?: string;
  date: string;
  link?: string;
  datePill?: 'urgent' | 'upcoming';
  done?: boolean;
  onToggle?: () => void;
};

export default function TaskRow({
  kind = 'urgent',
  label,
  sublabel,
  date,
  link,
  datePill,
  done = false,
  onToggle,
}: Props) {
  return (
    <div className={`t-row${done ? ' done' : ''}`} role="listitem">
      <button
        className={`checkbox ${done ? 'done' : kind}`}
        onClick={onToggle}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        style={{ background: 'none', border: '1.5px solid', cursor: 'pointer' }}
      >
        {done && <IconCheck size={11} />}
      </button>
      <div className="label">
        <span
          className={`priority-dot ${kind}`}
          style={done ? { opacity: 0.3 } : undefined}
        />
        <span>{label}</span>
        {sublabel && <span className="sublabel">· {sublabel}</span>}
      </div>
      <div className="meta-right">
        {link && (
          <span className="link-tag">
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                background: 'var(--ink-4)',
                display: 'inline-block',
              }}
            />
            {link}
          </span>
        )}
        <span className={`pill${datePill ? ` ${datePill}` : ''}`}>{date}</span>
      </div>
    </div>
  );
}
