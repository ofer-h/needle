import type { Task, CalendarEvent } from '../../shared/types';

export type TimelineItem =
  | { kind: 'task'; data: Task }
  | { kind: 'event'; data: CalendarEvent };

export function buildTimeline(
  tasks: Task[],
  events: CalendarEvent[],
  forDate?: string,
): TimelineItem[] {
  const tasksForDate =
    forDate === undefined ? tasks : tasks.filter((t) => t.date === forDate);
  const eventsForDate =
    forDate === undefined ? events : events.filter((e) => e.date === forDate);

  const fixedTasks = tasksForDate.filter((t) => t.scheduleKind === 'fixed' && t.startTime != null);
  const flexibleTasks = tasksForDate.filter((t) => t.scheduleKind === 'flexible');

  // Sort fixed tasks and events together by startTime; fixed task wins ties
  const anchors: TimelineItem[] = [
    ...eventsForDate.map((e): TimelineItem => ({ kind: 'event', data: e })),
    ...fixedTasks.map((t): TimelineItem => ({ kind: 'task', data: t })),
  ].sort((a, b) => {
    const aTime = a.kind === 'event' ? a.data.startTime : (a.data.startTime ?? '');
    const bTime = b.kind === 'event' ? b.data.startTime : (b.data.startTime ?? '');
    if (aTime < bTime) return -1;
    if (aTime > bTime) return 1;
    // Fixed task before event at the same time
    if (a.kind === 'task' && b.kind === 'event') return -1;
    if (a.kind === 'event' && b.kind === 'task') return 1;
    return 0;
  });

  // Group flexible tasks by slotIndex; clamp to last slot if out of range
  const lastSlot = anchors.length;
  const slotMap = new Map<number, Task[]>();
  for (const task of flexibleTasks) {
    const idx = task.slotIndex <= lastSlot ? task.slotIndex : lastSlot;
    const bucket = slotMap.get(idx) ?? [];
    bucket.push(task);
    slotMap.set(idx, bucket);
  }
  for (const bucket of slotMap.values()) {
    bucket.sort((a, b) => a.slotOrder - b.slotOrder);
  }

  const result: TimelineItem[] = [];

  // Slot 0: flexible tasks before the first anchor
  for (const t of slotMap.get(0) ?? []) {
    result.push({ kind: 'task', data: t });
  }

  // Each anchor followed by its slot
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    if (anchor !== undefined) result.push(anchor);
    for (const t of slotMap.get(i + 1) ?? []) {
      result.push({ kind: 'task', data: t });
    }
  }

  return result;
}

/**
 * Counts how many fixed anchors (events + fixed tasks) appear before `overIndex`
 * in the timeline array. That count is the new slotIndex for a dropped item.
 */
export function computeNewSlotIndex(timeline: TimelineItem[], overIndex: number): number {
  let anchorCount = 0;
  for (let i = 0; i < overIndex; i++) {
    const item = timeline[i];
    if (
      item !== undefined &&
      (item.kind === 'event' ||
        (item.kind === 'task' && item.data.scheduleKind === 'fixed'))
    ) {
      anchorCount++;
    }
  }
  return anchorCount;
}
