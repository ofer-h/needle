import { Fragment, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import FxWindow from '../Window/FxWindow';
import Section from './Section';
import TaskRow from './TaskRow';
import EventRow from './EventRow';
import TodayToolbar from './TodayToolbar';
import QuickAddRow from './QuickAddRow';
import UpcomingFooter from './UpcomingFooter';
import CaptureFab from './CaptureFab';
import GapDropZone from './dnd/GapDropZone';
import OverlayRow from './dnd/OverlayRow';
import { anchorsBeforeGap, computeNewSlotOrder } from './dnd/reorder';
import { useAppStore } from '../../state/store';
import { buildTimeline, type TimelineItem } from '../../utils/timeline';
import { formatLongDate, formatShortDate, toISODate } from '../../utils/date';
import './TodayScreen.css';

type Props = {
  onNavigateCapture: () => void;
};

export default function TodayScreen({ onNavigateCapture }: Props) {
  const tasks = useAppStore((s) => s.tasks);
  const events = useAppStore((s) => s.events);
  const toggleDone = useAppStore((s) => s.toggleDone);
  const reorderTask = useAppStore((s) => s.reorderTask);

  const [upcomingExpanded, setUpcomingExpanded] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // 5px move threshold avoids eating checkbox clicks
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const today = toISODate();
  const todayTasks = tasks.filter((t) => t.date === today || (t.isOverdue === true && !t.done));
  const overdueTasks = tasks.filter((t) => t.isOverdue === true && !t.done);
  const activeTodayTasks = tasks.filter((t) => t.date === today && t.isOverdue !== true);
  const upcomingItems = tasks
    .filter((t) => t.date !== today && t.isOverdue !== true && !t.done)
    .map((t) => t.title);

  const timelineItems = buildTimeline(activeTodayTasks, events, today);
  const overdueTimeline = buildTimeline(overdueTasks, []);

  const total = todayTasks.length;
  const doneCount = todayTasks.filter((t) => t.done).length;

  const activeTask = activeTaskId !== null ? tasks.find((t) => t.id === activeTaskId) : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragEnd(
    event: DragEndEvent,
    timeline: TimelineItem[],
    section: 'today' | 'overdue',
  ) {
    setActiveTaskId(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const activeRow = tasks.find((t) => t.id === activeId);
    if (!activeRow) return;
    if (section === 'overdue' && activeRow.isOverdue !== true) return;

    const gapMatch = /^gap-(today|overdue)-(\d+)$/.exec(String(over.id));
    if (!gapMatch) return;
    const [, gapSection, gapNStr] = gapMatch;
    if (gapSection === undefined || gapNStr === undefined || gapSection !== section) return;
    const gapN = parseInt(gapNStr, 10);

    const newSlotIndex = anchorsBeforeGap(timeline, gapN);
    const newSlotOrder = computeNewSlotOrder(
      tasks,
      timeline,
      activeId,
      gapN,
      newSlotIndex,
      section === 'overdue',
    );

    reorderTask(
      activeId,
      newSlotIndex,
      newSlotOrder,
      section === 'today'
        ? { date: today, timeSlot: 'today', isOverdue: false }
        : undefined,
    );
  }

  // A gap at position k sits between timeline[k-1] and timeline[k]; hide it
  // when either neighbour is the item being dragged.
  function isGapVisible(gapK: number, timeline: TimelineItem[]): boolean {
    if (activeTaskId === null) return true;
    const before = gapK > 0 ? timeline[gapK - 1] : undefined;
    const after = gapK < timeline.length ? timeline[gapK] : undefined;
    const beforeActive = before?.kind === 'task' && before.data.id === activeTaskId;
    const afterActive = after?.kind === 'task' && after.data.id === activeTaskId;
    return !beforeActive && !afterActive;
  }

  return (
    <FxWindow title="Focus · Today">
      <TodayToolbar
        dateLabel={formatLongDate(today)}
        total={total}
        doneCount={doneCount}
        onAddTask={onNavigateCapture}
      />

      <div className="today-scroll">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={(event: DragEndEvent) => {
            const overId = event.over?.id === undefined ? '' : String(event.over.id);
            if (overId.startsWith('gap-overdue-')) {
              handleDragEnd(event, overdueTimeline, 'overdue');
              return;
            }
            handleDragEnd(event, timelineItems, 'today');
          }}
        >
          {overdueTasks.length > 0 && (
            <Section title="Overdue" count={overdueTasks.length} accent="var(--urgent)">
              <GapDropZone id="gap-overdue-0" disabled={!isGapVisible(0, overdueTimeline)} />
              {overdueTimeline.map((item, index) => {
                if (item.kind === 'event') return null;
                const task = item.data;
                return (
                  <Fragment key={task.id}>
                    <TaskRow
                      id={task.id}
                      scheduleKind={task.scheduleKind}
                      kind={task.kind}
                      label={task.title}
                      date={dateLabelForTask(task)}
                      done={task.done}
                      onToggle={() => toggleDone(task.id)}
                      {...(task.sublabel !== undefined && { sublabel: task.sublabel })}
                      {...(task.link !== undefined && { link: task.link })}
                      {...(task.datePill !== undefined && { datePill: task.datePill })}
                    />
                    <GapDropZone
                      id={`gap-overdue-${index + 1}`}
                      disabled={!isGapVisible(index + 1, overdueTimeline)}
                    />
                  </Fragment>
                );
              })}
            </Section>
          )}

          <Section title="Today" date={formatShortDate(today)} count={activeTodayTasks.length}>
            <GapDropZone id="gap-today-0" disabled={!isGapVisible(0, timelineItems)} />
            {timelineItems.map((item, index) => {
              const gapK = index + 1;
              if (item.kind === 'event') {
                const event = item.data;
                return (
                  <Fragment key={`event-${event.id}`}>
                    <EventRow
                      id={event.id}
                      startTime={event.startTime}
                      label={event.label}
                      {...(event.sublabel !== undefined && { sublabel: event.sublabel })}
                    />
                    <GapDropZone
                      id={`gap-today-${gapK}`}
                      disabled={!isGapVisible(gapK, timelineItems)}
                    />
                  </Fragment>
                );
              }

              const task = item.data;
              return (
                <Fragment key={`task-${task.id}`}>
                  <TaskRow
                    id={task.id}
                    scheduleKind={task.scheduleKind}
                    kind={task.kind}
                    label={task.title}
                    date={dateLabelForTask(task)}
                    done={task.done}
                    onToggle={() => toggleDone(task.id)}
                    {...(task.sublabel !== undefined && { sublabel: task.sublabel })}
                    {...(task.link !== undefined && { link: task.link })}
                    {...(task.datePill !== undefined && { datePill: task.datePill })}
                  />
                  <GapDropZone
                    id={`gap-today-${gapK}`}
                    disabled={!isGapVisible(gapK, timelineItems)}
                  />
                </Fragment>
              );
            })}
          </Section>

          <DragOverlay>
            {activeTask !== undefined && activeTask.scheduleKind === 'flexible' ? (
              <OverlayRow
                kind={activeTask.kind}
                label={activeTask.title}
                date={dateLabelForTask(activeTask)}
                {...(activeTask.sublabel !== undefined ? { sublabel: activeTask.sublabel } : {})}
                {...(activeTask.datePill !== undefined ? { datePill: activeTask.datePill } : {})}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        <QuickAddRow onActivate={onNavigateCapture} />

        <UpcomingFooter
          items={upcomingItems}
          expanded={upcomingExpanded}
          onToggle={() => setUpcomingExpanded((v) => !v)}
        />
      </div>

      <CaptureFab onClick={onNavigateCapture} />
    </FxWindow>
  );
}

function dateLabelForTask(task: { date: string | null; dateLabel?: string }): string {
  if (task.dateLabel !== undefined) return task.dateLabel;
  return task.date ?? 'unplanned';
}
