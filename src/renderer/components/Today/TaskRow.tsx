import { useDraggable } from '@dnd-kit/core';
import type { ScheduleKind } from '../../../shared/types';
import { IconCheck } from '../Icons';

type Props = {
  id: string;
  scheduleKind: ScheduleKind;
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
  id,
  scheduleKind,
  kind = 'urgent',
  label,
  sublabel,
  date,
  link,
  datePill,
  done = false,
  onToggle,
}: Props) {
  if (scheduleKind === 'flexible') {
    return (
      <FlexibleTaskRow
        id={id}
        kind={kind}
        label={label}
        date={date}
        done={done}
        {...(onToggle !== undefined && { onToggle })}
        {...(sublabel !== undefined && { sublabel })}
        {...(link !== undefined && { link })}
        {...(datePill !== undefined && { datePill })}
      />
    );
  }

  return (
    <div className={`t-row${done ? ' done' : ''}`} role="listitem">
      {/* Drag handle placeholder — keeps columns aligned with flexible rows */}
      <span style={{ width: 20, flexShrink: 0, visibility: 'hidden' }} aria-hidden="true" />
      <button
        className={`checkbox ${done ? 'done' : kind}`}
        onClick={onToggle}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        style={{ background: 'none', border: '1.5px solid', cursor: 'pointer' }}
      >
        {done && <IconCheck size={11} />}
      </button>
      <div className="label">
        <span className={`priority-dot ${kind}`} style={done ? { opacity: 0.3 } : undefined} />
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

type FlexibleRowProps = Omit<Props, 'scheduleKind'> & { id: string };

function FlexibleTaskRow({
  id,
  kind = 'urgent',
  label,
  sublabel,
  date,
  link,
  datePill,
  done = false,
  onToggle,
}: FlexibleRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    // Wrapper takes the draggable ref; opacity 0 hides the original while DragOverlay floats
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0 : 1 }}>
      <div
        className={`t-row t-row-flexible${done ? ' done' : ''}`}
        role="listitem"
      >
        <button
          className="drag-handle"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          tabIndex={-1}
          style={{
            background: 'none',
            border: 'none',
            padding: '0 4px',
            cursor: 'grab',
            color: 'var(--ink-4)',
            fontSize: 14,
            lineHeight: 1,
            opacity: 0,
            transition: 'opacity 0.15s',
            display: 'inline-flex',
            alignItems: 'center',
            alignSelf: 'center',
            flexShrink: 0,
          }}
        >
          ⠿
        </button>
        <button
          className={`checkbox ${done ? 'done' : kind}`}
          onClick={onToggle}
          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
          style={{ background: 'none', border: '1.5px solid', cursor: 'pointer' }}
        >
          {done && <IconCheck size={11} />}
        </button>
        <div className="label">
          <span className={`priority-dot ${kind}`} style={done ? { opacity: 0.3 } : undefined} />
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
    </div>
  );
}
