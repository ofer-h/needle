import type { KeyboardEvent, ReactNode } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { ScheduleKind } from '@needle/domain/types';
import { useAppStore } from '../../state/store';
import { Checkbox } from '../primitives/Checkbox';
import { Icon } from '../primitives/Icon';
import { IconButton } from '../primitives/IconButton';
import { Pill } from '../primitives/Pill';
import type { PillVariant } from '../primitives/Pill';
import EventDetail from './EventDetail';
import ItemDetail from './ItemDetail';
import ItemMenu from './ItemMenu';

type TaskPriority = 'urgent' | 'upcoming' | 'faded';

type TaskItemRowProps = {
  kind: 'task';
  id: string;
  scheduleKind: ScheduleKind;
  label: string;
  date: string;
  priority?: TaskPriority;
  sublabel?: string;
  link?: string;
  datePill?: 'urgent' | 'upcoming';
  done?: boolean;
  onToggle?: () => void;
};

type EventItemRowProps = {
  kind: 'event';
  id: string;
  label: string;
  startTime: string;
  sublabel?: string;
};

export type ItemRowProps = TaskItemRowProps | EventItemRowProps;

export default function ItemRow(props: ItemRowProps) {
  if (props.kind === 'event') return <EventItemRow {...props} />;
  if (props.scheduleKind === 'flexible') return <FlexibleTaskItemRow {...props} />;
  return <FixedTaskItemRow {...props} />;
}

/* ── Task row body ────────────────────────────────────────────── */

type TaskBodyProps = {
  taskId: string;
  priority: TaskPriority;
  label: string;
  date: string;
  titleId: string;
  sublabel?: string;
  link?: string;
  datePill?: 'urgent' | 'upcoming';
  subtaskProgress?: {
    done: number;
    total: number;
  };
  done: boolean;
  onToggle?: (() => void) | undefined;
};

function TaskBody({
  taskId,
  priority,
  label,
  date,
  titleId,
  sublabel,
  link,
  datePill,
  subtaskProgress,
  done,
  onToggle,
}: TaskBodyProps) {
  const checkboxTone: 'neutral' | 'urgent' | 'upcoming' =
    priority === 'urgent' ? 'urgent' : priority === 'upcoming' ? 'upcoming' : 'neutral';

  return (
    <>
      <span className="t-row__control" onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={done}
          {...(onToggle !== undefined ? { onToggle } : {})}
          tone={checkboxTone}
          label={done ? 'Mark incomplete' : 'Mark complete'}
        />
      </span>
      <div className="label">
        <span className={`priority-dot ${priority}`} aria-hidden="true" />
        <span id={titleId}>{label}</span>
        {sublabel !== undefined && <span className="sublabel">· {sublabel}</span>}
      </div>
      <div className="meta-right">
        {subtaskProgress !== undefined && (
          <Pill variant="neutral" size="sm" tabular>
            {subtaskProgress.done}/{subtaskProgress.total}
          </Pill>
        )}
        {link !== undefined && (
          <span className="link-tag">
            <span className="link-tag__dot" aria-hidden="true" />
            {link}
          </span>
        )}
        <Pill variant={pillVariantFor(datePill)} tabular>
          {date}
        </Pill>
        <span className="t-row__menu" onClick={(event) => event.stopPropagation()}>
          <ItemMenu taskId={taskId} />
        </span>
      </div>
    </>
  );
}

function pillVariantFor(kind?: 'urgent' | 'upcoming'): PillVariant {
  if (kind === 'urgent') return 'urgent';
  if (kind === 'upcoming') return 'upcoming';
  return 'neutral';
}

/* ── Task variants ────────────────────────────────────────────── */

function FixedTaskItemRow({
  id,
  priority = 'urgent',
  label,
  sublabel,
  date,
  link,
  datePill,
  done = false,
  onToggle,
}: TaskItemRowProps) {
  const task = useAppStore((s) => s.tasks.find((item) => item.id === id));
  const expandedItemId = useAppStore((s) => s.expandedItemId);
  const expandItem = useAppStore((s) => s.expandItem);
  const itemKey = `task:${id}`;
  const isExpanded = expandedItemId === itemKey;
  const titleId = `item-row-title-${id}`;
  const detailId = `item-row-detail-${id}`;
  const subtaskProgress = getSubtaskProgress(task);

  function handleToggleExpand() {
    expandItem(isExpanded ? null : itemKey);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleToggleExpand();
  }

  return (
    <>
      <div
        className={`t-row${done ? ' done' : ''}${isExpanded ? ' expanded' : ''}`}
        role="listitem"
        tabIndex={0}
        data-item-id={id}
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? detailId : undefined}
        onClick={handleToggleExpand}
        onKeyDown={handleKeyDown}
      >
        <span className="t-row__handle-placeholder" aria-hidden="true" />
        <TaskBody
          taskId={id}
          priority={priority}
          label={label}
          titleId={titleId}
          date={date}
          {...(sublabel !== undefined ? { sublabel } : {})}
          {...(link !== undefined ? { link } : {})}
          {...(datePill !== undefined ? { datePill } : {})}
          {...(subtaskProgress !== undefined ? { subtaskProgress } : {})}
          done={done}
          onToggle={onToggle}
        />
      </div>
      {isExpanded && <ItemDetail id={detailId} taskId={id} labelledBy={titleId} />}
    </>
  );
}

function FlexibleTaskItemRow({
  id,
  priority = 'urgent',
  label,
  sublabel,
  date,
  link,
  datePill,
  done = false,
  onToggle,
}: TaskItemRowProps) {
  const task = useAppStore((s) => s.tasks.find((item) => item.id === id));
  const expandedItemId = useAppStore((s) => s.expandedItemId);
  const expandItem = useAppStore((s) => s.expandItem);
  const itemKey = `task:${id}`;
  const isExpanded = expandedItemId === itemKey;
  const titleId = `item-row-title-${id}`;
  const detailId = `item-row-detail-${id}`;
  const subtaskProgress = getSubtaskProgress(task);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: isExpanded,
  });

  const wrapperClass = `t-row-flexible-wrap ds-hover-reveal${
    isDragging ? ' t-row-flexible-wrap--dragging' : ''
  }`;

  function handleToggleExpand() {
    expandItem(isExpanded ? null : itemKey);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleToggleExpand();
  }

  const handle: ReactNode = isExpanded ? (
    <span className="t-row__handle-placeholder" aria-hidden="true" />
  ) : (
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
      <div
        className={`t-row t-row-flexible${done ? ' done' : ''}${isExpanded ? ' expanded' : ''}`}
        role="listitem"
        tabIndex={0}
        data-item-id={id}
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? detailId : undefined}
        onClick={handleToggleExpand}
        onKeyDown={handleKeyDown}
      >
        {handle}
        <TaskBody
          taskId={id}
          priority={priority}
          label={label}
          titleId={titleId}
          date={date}
          {...(sublabel !== undefined ? { sublabel } : {})}
          {...(link !== undefined ? { link } : {})}
          {...(datePill !== undefined ? { datePill } : {})}
          {...(subtaskProgress !== undefined ? { subtaskProgress } : {})}
          done={done}
          onToggle={onToggle}
        />
      </div>
      {isExpanded && <ItemDetail id={detailId} taskId={id} labelledBy={titleId} />}
    </div>
  );
}

function getSubtaskProgress(task: ReturnType<typeof useAppStore.getState>['tasks'][number] | undefined) {
  if (task?.subtasks === undefined || task.subtasks.length === 0) return undefined;
  return {
    done: task.subtasks.filter((subtask) => subtask.done).length,
    total: task.subtasks.length,
  };
}

/* ── Event row ───────────────────────────────────────────────── */

function EventItemRow({ id, startTime, label, sublabel }: EventItemRowProps) {
  const expandedItemId = useAppStore((s) => s.expandedItemId);
  const expandItem = useAppStore((s) => s.expandItem);
  const itemKey = `event:${id}`;
  const isExpanded = expandedItemId === itemKey;
  const titleId = `item-row-title-event-${id}`;
  const detailId = `item-row-detail-event-${id}`;

  function handleToggleExpand() {
    expandItem(isExpanded ? null : itemKey);
  }

  return (
    <>
      <div
        className={`t-row event${isExpanded ? ' expanded' : ''}`}
        role="listitem"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={isExpanded ? detailId : undefined}
        onClick={handleToggleExpand}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          handleToggleExpand();
        }}
      >
        <span className="t-row__handle-placeholder" aria-hidden="true" />
        <span className="t-row__event-icon">
          <Icon name="calendar" size={14} tone="calendar" />
        </span>
        <div className="label">
          <span id={titleId} className="t-row__event-label">{label}</span>
          {sublabel !== undefined && <span className="sublabel">· {sublabel}</span>}
        </div>
        <div className="meta-right">
          <Pill variant="outline" tabular>
            {startTime}
          </Pill>
        </div>
      </div>
      {isExpanded && <EventDetail id={detailId} eventId={id} labelledBy={titleId} />}
    </>
  );
}
