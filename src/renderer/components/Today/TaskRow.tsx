import type { ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { ScheduleKind } from '../../../shared/types';
import { Checkbox } from '../primitives/Checkbox';
import { IconButton } from '../primitives/IconButton';
import { Pill } from '../primitives/Pill';
import type { PillVariant } from '../primitives/Pill';

type Kind = 'urgent' | 'upcoming' | 'faded';

type Props = {
  id: string;
  scheduleKind: ScheduleKind;
  kind?: Kind;
  label: string;
  sublabel?: string;
  date: string;
  link?: string;
  datePill?: 'urgent' | 'upcoming';
  done?: boolean;
  onToggle?: () => void;
};

export default function TaskRow(props: Props) {
  if (props.scheduleKind === 'flexible') return <FlexibleTaskRow {...props} />;
  return <FixedTaskRow {...props} />;
}

/* ── Shared body content ───────────────────────────────────────── */

type BodyProps = {
  kind: Kind;
  label: string;
  sublabel?: string;
  date: string;
  link?: string;
  datePill?: 'urgent' | 'upcoming';
  done: boolean;
  onToggle?: (() => void) | undefined;
};

function RowBody({ kind, label, sublabel, date, link, datePill, done, onToggle }: BodyProps) {
  const checkboxTone: 'neutral' | 'urgent' | 'upcoming' =
    kind === 'urgent' ? 'urgent' : kind === 'upcoming' ? 'upcoming' : 'neutral';

  return (
    <>
      <Checkbox
        checked={done}
        {...(onToggle !== undefined ? { onToggle } : {})}
        tone={checkboxTone}
        label={done ? 'Mark incomplete' : 'Mark complete'}
      />
      <div className="label">
        <span className={`priority-dot ${kind}`} aria-hidden="true" />
        <span>{label}</span>
        {sublabel !== undefined && <span className="sublabel">· {sublabel}</span>}
      </div>
      <div className="meta-right">
        {link !== undefined && (
          <span className="link-tag">
            <span className="link-tag__dot" aria-hidden="true" />
            {link}
          </span>
        )}
        <Pill variant={pillVariantFor(datePill)} tabular>
          {date}
        </Pill>
      </div>
    </>
  );
}

function pillVariantFor(kind?: 'urgent' | 'upcoming'): PillVariant {
  if (kind === 'urgent') return 'urgent';
  if (kind === 'upcoming') return 'upcoming';
  return 'neutral';
}

/* ── Fixed (anchored) row — no drag handle ─────────────────────── */

function FixedTaskRow({
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
      <span className="t-row__handle-placeholder" aria-hidden="true" />
      <RowBody
        kind={kind}
        label={label}
        {...(sublabel !== undefined ? { sublabel } : {})}
        date={date}
        {...(link !== undefined ? { link } : {})}
        {...(datePill !== undefined ? { datePill } : {})}
        done={done}
        onToggle={onToggle}
      />
    </div>
  );
}

/* ── Flexible (draggable) row ─────────────────────────────────── */

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
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  const wrapperClass = `t-row-flexible-wrap ds-hover-reveal${
    isDragging ? ' t-row-flexible-wrap--dragging' : ''
  }`;

  const handle: ReactNode = (
    <IconButton
      label="Drag to reorder"
      variant="ghost"
      size="sm"
      hoverReveal
      className="t-row__drag"
      {...attributes}
      {...listeners}
      tabIndex={-1}
    >
      <span aria-hidden="true">⠿</span>
    </IconButton>
  );

  return (
    <div ref={setNodeRef} className={wrapperClass} aria-hidden={isDragging || undefined}>
      <div className={`t-row t-row-flexible${done ? ' done' : ''}`} role="listitem">
        {handle}
        <RowBody
          kind={kind}
          label={label}
          {...(sublabel !== undefined ? { sublabel } : {})}
          date={date}
          {...(link !== undefined ? { link } : {})}
          {...(datePill !== undefined ? { datePill } : {})}
          done={done}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
}
