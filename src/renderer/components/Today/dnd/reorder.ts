import type { Task } from '../../../../shared/types';
import type { TimelineItem } from '../../../utils/timeline';

/** Compute the new `slotOrder` for a task being dropped into gap `gapN` of
 * the supplied timeline. Returns a midpoint between predecessor/successor
 * peers, or 100-step offsets when one neighbour is absent. */
export function computeNewSlotOrder(
  tasks: Task[],
  timeline: TimelineItem[],
  activeId: string,
  gapN: number,
  newSlotIndex: number,
  isOverdueSection: boolean,
): number {
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

  const timelineIndexById = new Map<string, number>();
  timeline.forEach((item, idx) => {
    if (item.kind === 'task') timelineIndexById.set(item.data.id, idx);
  });

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

/** Count anchors (events + fixed tasks) appearing before position `gapN`. */
export function anchorsBeforeGap(timeline: TimelineItem[], gapN: number): number {
  let count = 0;
  for (let i = 0; i < gapN && i < timeline.length; i++) {
    const item = timeline[i];
    if (
      item !== undefined &&
      (item.kind === 'event' || (item.kind === 'task' && item.data.scheduleKind === 'fixed'))
    ) {
      count++;
    }
  }
  return count;
}
