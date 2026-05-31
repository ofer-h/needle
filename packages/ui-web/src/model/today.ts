/* buildTodayView — pure assembly of canonical entities into the canonical
 * TodayItemView[] the UI renders. No React, no I/O; fully unit-testable. */

import type {
  Intervention,
  Item,
  ItemAssignment,
  ItemId,
  ItemOccurrence,
  ItemPlan,
  ItemRelation,
  TodayItemView,
} from './domain';
import { atTimeOnDay, formatClock, toDate } from './time';

/** The raw canonical data a board renders from. */
export type TodayData = {
  items: Item[];
  plans: ItemPlan[];
  occurrences: ItemOccurrence[];
  relations: ItemRelation[];
  assignments?: ItemAssignment[];
  interventions?: Intervention[];
};

const byId = <T extends { itemId: ItemId }>(rows: T[], itemId: ItemId): T | undefined =>
  rows.find((r) => r.itemId === itemId);

/** Children nested under `itemId` via a `contains` relation. */
export function childrenOf(data: TodayData, itemId: ItemId): Item[] {
  const childIds = data.relations
    .filter((r) => r.relationType === 'contains' && r.fromItemId === itemId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => r.toItemId);
  return childIds
    .map((id) => data.items.find((i) => i.id === id))
    .filter((i): i is Item => i !== undefined);
}

/** True when this item is nested under another (so it's not a top-level row). */
function isChild(data: TodayData, itemId: ItemId): boolean {
  return data.relations.some((r) => r.relationType === 'contains' && r.toItemId === itemId);
}

/** The effective start instant of an item today: occurrence start, else the
 * plan's anchored start time on `now`'s day, else null (unscheduled/float). */
export function effectiveStart(
  plan: ItemPlan | undefined,
  occurrence: ItemOccurrence | undefined,
  now: Date,
): Date | null {
  if (occurrence) return toDate(occurrence.startsAt);
  if (plan?.mode === 'anchor' && plan.startTime) return atTimeOnDay(now, plan.startTime);
  return null;
}

function buildOne(data: TodayData, item: Item, now: Date): TodayItemView {
  const plan = byId(data.plans, item.id);
  const occurrence = data.occurrences.find((o) => o.itemId === item.id);
  const assignments = (data.assignments ?? []).filter((a) => a.itemId === item.id);
  const pendingInterventions = (data.interventions ?? []).filter(
    (i) => i.itemId === item.id && (i.status === 'scheduled' || i.status === 'active'),
  );

  const children = childrenOf(data, item.id);
  const childProgress = {
    done: children.filter((c) => c.status === 'done').length,
    total: children.length,
  };

  const relationBadges = data.relations.filter(
    (r) => r.relationType !== 'contains' && (r.fromItemId === item.id || r.toItemId === item.id),
  );

  const start = effectiveStart(plan, occurrence, now);

  let eventState: TodayItemView['eventState'] | undefined;
  if (occurrence) {
    const s = toDate(occurrence.startsAt).getTime();
    const e = toDate(occurrence.endsAt).getTime();
    const t = now.getTime();
    eventState = t < s ? 'upcoming' : t > e ? 'past' : 'in_progress';
  }

  const isDone = item.status === 'done';
  const isOverdue =
    !isDone &&
    ((occurrence ? toDate(occurrence.endsAt).getTime() < now.getTime() : false) ||
      (start !== null && !occurrence ? start.getTime() < now.getTime() : false));

  const dateLabel = start ? formatClock(start) : plan?.mode === 'stash' ? 'someday' : 'anytime';

  return {
    item,
    assignments,
    childProgress,
    relationBadges,
    isOverdue,
    dateLabel,
    pendingInterventions,
    ...(plan ? { plan } : {}),
    ...(occurrence ? { occurrence } : {}),
    ...(eventState ? { eventState } : {}),
  };
}

/** Assemble every top-level item into a TodayItemView, sorted by start time
 * (scheduled first, ascending), then unscheduled by creation order. Templates
 * may re-sort/group afterward via their `sortBy` / `grouping` config. */
export function buildTodayView(data: TodayData, now: Date = new Date()): TodayItemView[] {
  const views = data.items
    .filter((item) => !isChild(data, item.id) && item.status !== 'archived')
    .map((item) => buildOne(data, item, now));

  return views.sort((a, b) => {
    const sa = effectiveStart(a.plan, a.occurrence, now);
    const sb = effectiveStart(b.plan, b.occurrence, now);
    if (sa && sb) return sa.getTime() - sb.getTime();
    if (sa) return -1;
    if (sb) return 1;
    return 0;
  });
}
