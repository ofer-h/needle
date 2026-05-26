import { useState, Fragment } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import FxWindow from '../Window/FxWindow';
import Section from './Section';
import TaskRow from './TaskRow';
import EventRow from './EventRow';
import { IconPlus, IconChevron } from '../Icons';
import { useAppStore } from '../../state/store';
import { buildTimeline } from '../../utils/timeline';
import type { TimelineItem } from '../../utils/timeline';

type Props = {
  onNavigateCapture: () => void;
};

// ── Gap drop zone ──────────────────────────────────────────────────────────
// Rendered between every consecutive pair of timeline items (and before/after).
// Each zone is a droppable pocket; when hovered it shows as a colored insert line.

type GapProps = {
  id: string;
  // When true the zone stays in the DOM (preserving layout) but won't accept drops.
  // This avoids any layout shift: all gaps are always rendered.
  disabled?: boolean;
};

function GapDropZone({ id, disabled = false }: GapProps) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });
  const active = isOver && !disabled;
  return (
    // Fixed outer height — never changes, so no layout shift when a drag starts
    // or when adjacent gaps are disabled. The inner indicator expands on hover
    // to signal "item will land here" without touching surrounding items.
    <div
      ref={setNodeRef}
      style={{
        height: active ? 32 : 8,
        display: 'flex',
        alignItems: 'center',
        transition: 'height 0.15s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: active ? 3 : 0,
          borderRadius: 2,
          background: 'var(--urgent)',
          opacity: active ? 1 : 0,
          transition: 'height 0.15s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.1s ease',
        }}
      />
    </div>
  );
}

// ── Overlay row ────────────────────────────────────────────────────────────
// Pure display clone rendered in DragOverlay — no DnD hooks, so it's safe
// to render outside the normal sortable item lifecycle.

type OverlayRowProps = {
  kind?: 'urgent' | 'upcoming' | 'faded';
  label: string;
  sublabel?: string;
  date: string;
  datePill?: 'urgent' | 'upcoming';
};

function OverlayRow({ kind = 'urgent', label, sublabel, date, datePill }: OverlayRowProps) {
  return (
    <div
      className="t-row t-row-flexible"
      role="listitem"
      style={{
        boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
        borderRadius: 8,
        background: 'var(--bg)',
        cursor: 'grabbing',
      }}
    >
      <button
        aria-hidden="true"
        tabIndex={-1}
        style={{
          background: 'none',
          border: 'none',
          padding: '0 4px',
          cursor: 'grabbing',
          color: 'var(--ink-4)',
          fontSize: 14,
          lineHeight: 1,
          opacity: 1,
          display: 'inline-flex',
          alignItems: 'center',
          alignSelf: 'center',
          flexShrink: 0,
        }}
      >
        ⠿
      </button>
      <div
        className={`checkbox ${kind}`}
        style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid', flexShrink: 0 }}
      />
      <div className="label">
        <span className={`priority-dot ${kind}`} />
        <span>{label}</span>
        {sublabel && <span className="sublabel">· {sublabel}</span>}
      </div>
      <div className="meta-right">
        <span className={`pill${datePill ? ` ${datePill}` : ''}`}>{date}</span>
      </div>
    </div>
  );
}

// ── Drag-end logic ─────────────────────────────────────────────────────────

function computeNewSlotOrder(
  tasks: ReturnType<typeof useAppStore.getState>['tasks'],
  timeline: TimelineItem[],
  activeId: string,
  gapN: number,
  newSlotIndex: number,
  isOverdueSection: boolean,
): number {
  // Flexible peers in the target slot, excluding the task being moved
  const slotPeers = tasks
    .filter(
      (t) =>
        t.id !== activeId &&
        t.scheduleKind === 'flexible' &&
        t.slotIndex === newSlotIndex &&
        t.timeSlot === 'today' &&
        (isOverdueSection ? t.isOverdue === true : t.isOverdue !== true),
    )
    .sort((a, b) => a.slotOrder - b.slotOrder);

  // Map each peer to its position in the current timeline
  const timelineIndexById = new Map<string, number>();
  timeline.forEach((item, idx) => {
    if (item.kind === 'task') {
      timelineIndexById.set(item.data.id, idx);
    }
  });

  // Split peers into those that appear before vs. at/after the gap position
  const peersBeforeGap = slotPeers.filter((p) => (timelineIndexById.get(p.id) ?? -1) < gapN);
  const peersAfterGap = slotPeers.filter(
    (p) => (timelineIndexById.get(p.id) ?? timeline.length) >= gapN,
  );

  const predecessor = peersBeforeGap[peersBeforeGap.length - 1];
  const successor = peersAfterGap[0];

  if (predecessor === undefined && successor === undefined) return 0;
  if (predecessor === undefined) return (successor?.slotOrder ?? 0) - 1;
  if (successor === undefined) return predecessor.slotOrder + 100;
  return (predecessor.slotOrder + successor.slotOrder) / 2;
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function TodayScreen({ onNavigateCapture }: Props) {
  const tasks = useAppStore((s) => s.tasks);
  const events = useAppStore((s) => s.events);
  const toggleDone = useAppStore((s) => s.toggleDone);
  const reorderTask = useAppStore((s) => s.reorderTask);

  const [upcomingExpanded, setUpcomingExpanded] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Require a 5px move before starting a drag to avoid eating checkbox clicks
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Partition today tasks
  const todayTasks = tasks.filter((t) => t.timeSlot === 'today');
  const overdueTasks = todayTasks.filter((t) => t.isOverdue === true && !t.done);
  const activeTodayTasks = todayTasks.filter((t) => t.isOverdue !== true);

  // Build merged timelines
  const timelineItems = buildTimeline(activeTodayTasks, events);
  const overdueTimeline = buildTimeline(overdueTasks, []);

  const total = todayTasks.length;
  const doneCount = todayTasks.filter((t) => t.done).length;
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // The task currently being dragged (used for DragOverlay rendering)
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
    if (!tasks.find((t) => t.id === activeId)) return;

    // Parse gap zone ID: "gap-today-3" or "gap-overdue-3"
    const gapMatch = /^gap-(today|overdue)-(\d+)$/.exec(String(over.id));
    if (!gapMatch) return;
    const gapSection = gapMatch[1];
    const gapNStr = gapMatch[2];
    if (!gapSection || !gapNStr || gapSection !== section) return;
    const gapN = parseInt(gapNStr, 10);

    // Count anchors (events + fixed tasks) that appear before position gapN
    // → that count is the target slotIndex
    let newSlotIndex = 0;
    for (let i = 0; i < gapN && i < timeline.length; i++) {
      const item = timeline[i];
      if (
        item !== undefined &&
        (item.kind === 'event' ||
          (item.kind === 'task' && item.data.scheduleKind === 'fixed'))
      ) {
        newSlotIndex++;
      }
    }

    const newSlotOrder = computeNewSlotOrder(
      tasks,
      timeline,
      activeId,
      gapN,
      newSlotIndex,
      section === 'overdue',
    );

    reorderTask(activeId, newSlotIndex, newSlotOrder);
  }

  function handleOverdueDragEnd(event: DragEndEvent) {
    handleDragEnd(event, overdueTimeline, 'overdue');
  }

  function handleTodayDragEnd(event: DragEndEvent) {
    handleDragEnd(event, timelineItems, 'today');
  }

  const isDragging = activeTaskId !== null;

  // A gap at position k sits between timelineItems[k-1] and timelineItems[k].
  // Hide it when either neighbour is the item being dragged — dropping there is a
  // no-op and showing two pockets around the ghost placeholder is confusing.
  function isGapVisible(gapK: number, timeline: TimelineItem[]): boolean {
    if (!activeTaskId) return true;
    const before = gapK > 0 ? timeline[gapK - 1] : undefined;
    const after = gapK < timeline.length ? timeline[gapK] : undefined;
    const beforeActive = before?.kind === 'task' && before.data.id === activeTaskId;
    const afterActive = after?.kind === 'task' && after.data.id === activeTaskId;
    return !beforeActive && !afterActive;
  }

  const UPCOMING_PLACEHOLDER = [
    'Review PR from Tal',
    'Book dentist appointment',
    "Plan dad's birthday gift",
  ];

  return (
    <FxWindow title="Focus · Today">
      {/* Sub-toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '18px 40px 14px',
          borderBottom: '0.5px solid var(--hairline)',
        }}
      >
        <div>
          <div
            className="t-display"
            style={{ fontSize: 32, lineHeight: 1, color: 'var(--ink)' }}
          >
            Today
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--ink-3)',
              marginTop: 4,
              letterSpacing: '-0.005em',
            }}
          >
            Sunday, May 25 · {total} tasks · {doneCount} done
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 6 }}>
          <div
            style={{
              width: 88,
              height: 4,
              background: 'var(--surface-sub)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'var(--upcoming)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 11.5,
              color: 'var(--ink-3)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {doneCount}/{total}
          </span>
        </div>

        {/* Add task button */}
        <button
          onClick={onNavigateCapture}
          style={{
            height: 30,
            padding: '0 14px 0 11px',
            borderRadius: 8,
            background: 'var(--ink)',
            color: 'var(--bg)',
            border: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontFamily: 'var(--sans)',
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: '-0.005em',
            cursor: 'pointer',
          }}
        >
          <IconPlus size={11} />
          <span>Add task</span>
          <span
            className="t-mono"
            style={{
              fontSize: 10,
              opacity: 0.6,
              marginLeft: 4,
              paddingLeft: 7,
              borderLeft: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            ⌘ N
          </span>
        </button>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '12px 32px 100px',
        }}
      >
        {/* Overdue section */}
        {overdueTasks.length > 0 && (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleOverdueDragEnd}
          >
            <Section title="Overdue" count={overdueTasks.length} accent="var(--urgent)">
              <GapDropZone
                id="gap-overdue-0"
                disabled={!isGapVisible(0, overdueTimeline)}
              />
              {overdueTimeline.map((item, index) => {
                if (item.kind === 'event') return null;
                const t = item.data;
                return (
                  <Fragment key={t.id}>
                    <TaskRow
                      id={t.id}
                      scheduleKind={t.scheduleKind}
                      kind={t.kind}
                      label={t.title}
                      date={t.date}
                      done={t.done}
                      onToggle={() => toggleDone(t.id)}
                      {...(t.sublabel !== undefined && { sublabel: t.sublabel })}
                      {...(t.link !== undefined && { link: t.link })}
                      {...(t.datePill !== undefined && { datePill: t.datePill })}
                    />
                    <GapDropZone
                      id={`gap-overdue-${index + 1}`}
                      disabled={!isGapVisible(index + 1, overdueTimeline)}
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
                  date={activeTask.date}
                  {...(activeTask.sublabel !== undefined && { sublabel: activeTask.sublabel })}
                  {...(activeTask.datePill !== undefined && { datePill: activeTask.datePill })}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Today timeline */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleTodayDragEnd}
        >
          <Section title="Today" date="Sun, May 25" count={activeTodayTasks.length}>
            <GapDropZone
              id="gap-today-0"
              disabled={!isGapVisible(0, timelineItems)}
            />
            {timelineItems.map((item, index) => {
              const gapK = index + 1;

              if (item.kind === 'event') {
                const e = item.data;
                return (
                  <Fragment key={`event-${e.id}`}>
                    <EventRow
                      startTime={e.startTime}
                      label={e.label}
                      {...(e.sublabel !== undefined && { sublabel: e.sublabel })}
                    />
                    <GapDropZone
                      id={`gap-today-${gapK}`}
                      disabled={!isGapVisible(gapK, timelineItems)}
                    />
                  </Fragment>
                );
              }

              const t = item.data;
              return (
                <Fragment key={`task-${t.id}`}>
                  <TaskRow
                    id={t.id}
                    scheduleKind={t.scheduleKind}
                    kind={t.kind}
                    label={t.title}
                    date={t.date}
                    done={t.done}
                    onToggle={() => toggleDone(t.id)}
                    {...(t.sublabel !== undefined && { sublabel: t.sublabel })}
                    {...(t.link !== undefined && { link: t.link })}
                    {...(t.datePill !== undefined && { datePill: t.datePill })}
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
                date={activeTask.date}
                {...(activeTask.sublabel !== undefined && { sublabel: activeTask.sublabel })}
                {...(activeTask.datePill !== undefined && { datePill: activeTask.datePill })}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Quick-add row */}
        <div className="t-quickadd" onClick={onNavigateCapture} role="button" tabIndex={0}>
          <span className="plus-bubble">
            <IconPlus size={10} />
          </span>
          <span>
            Add a task, paste anything, or hit&nbsp;
            <span
              className="t-mono"
              style={{
                fontSize: 10,
                background: 'var(--surface-sub)',
                padding: '1px 5px',
                borderRadius: 4,
                color: 'var(--ink-2)',
              }}
            >
              ⌘ N
            </span>
          </span>
        </div>

        {/* Upcoming footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 18,
            padding: '0 10px',
            fontSize: 12,
            color: 'var(--ink-3)',
          }}
        >
          <span style={{ flex: 1, height: 0.5, background: 'var(--hairline)', display: 'block' }} />
          <button
            onClick={() => setUpcomingExpanded((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--ink-3)',
              fontFamily: 'var(--sans)',
              fontSize: 12,
            }}
          >
            <span>Upcoming</span>
            <span
              style={{
                fontSize: 10.5,
                fontVariantNumeric: 'tabular-nums',
                padding: '1px 7px',
                borderRadius: 999,
                background: 'var(--surface-sub)',
                color: 'var(--ink-2)',
              }}
            >
              5
            </span>
            <span
              style={{
                display: 'inline-flex',
                transform: upcomingExpanded ? 'rotate(180deg)' : undefined,
                transition: 'transform 0.2s',
              }}
            >
              <IconChevron size={11} />
            </span>
          </button>
          <span style={{ flex: 1, height: 0.5, background: 'var(--hairline)', display: 'block' }} />
        </div>

        {upcomingExpanded && (
          <div
            style={{
              marginTop: 8,
              padding: '0 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {UPCOMING_PLACEHOLDER.map((title) => (
              <div
                key={title}
                style={{
                  padding: '6px 8px',
                  fontSize: 13,
                  color: 'var(--ink-3)',
                  borderRadius: 6,
                }}
              >
                {title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={onNavigateCapture} aria-label="New capture">
        <span className="ic">
          <IconPlus size={14} />
        </span>
        <span>Capture</span>
        <span className="kbd">⌘ K</span>
      </button>
    </FxWindow>
  );
}
