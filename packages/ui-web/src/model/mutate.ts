/* Pure board mutations. Each returns a NEW TodayData (the previous one is left
 * intact, which is what makes RevisionLog snapshots cheap + revert trivial). */

import { mkItem, mkOccurrence, mkPlan, mkRelation, isoDate, localTime } from './factory';
import { brand } from './ids';
import type { CommitmentLevel, ISODate, ISODateTime, Item, ItemId, ItemKind } from './domain';
import type { TodayData } from './today';
import { toDate } from './time';

const clone = (data: TodayData): TodayData => structuredClone(data);

function atOn(day: Date, hhmm: string): ISODateTime {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return brand<ISODateTime>(d.toISOString());
}

function minusMinutes(iso: ISODateTime, mins: number): string {
  const d = toDate(iso);
  d.setMinutes(d.getMinutes() - mins);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function setStatus(item: Item, done: boolean): void {
  item.status = done ? 'done' : 'open';
}

/** Toggle an item (or child) between done and open. */
export function toggleItemDone(data: TodayData, itemId: ItemId): TodayData {
  const next = clone(data);
  const item = next.items.find((i) => i.id === itemId);
  if (item) setStatus(item, item.status !== 'done');
  return next;
}

/** Rename an item; empty titles are ignored (kept as-is). */
export function setItemTitle(data: TodayData, itemId: ItemId, title: string): TodayData {
  const trimmed = title.trim();
  if (!trimmed) return data;
  const next = clone(data);
  const item = next.items.find((i) => i.id === itemId);
  if (item) item.title = trimmed;
  return next;
}

/** Add a child item nested under `parentId` via a `contains` relation. */
export function addChild(data: TodayData, parentId: ItemId, title: string): TodayData {
  const trimmed = title.trim();
  if (!trimmed) return data;
  const next = clone(data);
  const parent = next.items.find((i) => i.id === parentId);
  if (!parent) return data;
  const child = mkItem({ title: trimmed, kind: 'task', bucket: parent.bucket });
  const siblingCount = next.relations.filter(
    (r) => r.relationType === 'contains' && r.fromItemId === parentId,
  ).length;
  next.items.push(child);
  next.relations.push(mkRelation(parentId, child.id, 'contains', siblingCount));
  return next;
}

export type NewItemInput = {
  title: string;
  kind?: ItemKind;
  startTime?: string;
  durationMinutes?: number;
  bucket?: Item['bucket'];
  commitmentLevel?: Item['commitmentLevel'];
};

/** Create a top-level item (manual or parsed). Anchored when a start time is
 * given, otherwise a floating task. Returns { data, itemId } so callers can
 * chain (e.g. attach a `**` subtask to the just-added item). */
export function addItem(data: TodayData, input: NewItemInput): { data: TodayData; itemId: ItemId } {
  const next = clone(data);
  const item = mkItem({
    title: input.title.trim(),
    kind: input.kind ?? 'task',
    ...(input.bucket ? { bucket: input.bucket } : {}),
    ...(input.commitmentLevel ? { commitmentLevel: input.commitmentLevel } : {}),
  });
  next.items.push(item);
  next.plans.push(
    mkPlan(item.id, {
      mode: input.startTime ? 'anchor' : 'float',
      ...(input.startTime ? { startTime: localTime(input.startTime) } : {}),
    }),
  );
  return { data: next, itemId: item.id };
}

export type NewEventInput = {
  title: string;
  startTime: string;
  endTime?: string;
  commitmentLevel?: CommitmentLevel;
};

/** Create a fixed event/alarm: item (kind 'event') + anchored plan + a confirmed
 * occurrence on `day`. End defaults to +30m when omitted. */
export function addEvent(
  data: TodayData,
  input: NewEventInput,
  day: Date,
): { data: TodayData; itemId: ItemId } {
  const next = clone(data);
  const item = mkItem({
    title: input.title.trim(),
    kind: 'event',
    commitmentLevel: input.commitmentLevel ?? 'firm',
  });
  const startIso = atOn(day, input.startTime);
  const endIso = input.endTime ? atOn(day, input.endTime) : atOn(day, minusMinutes(startIso, -30));
  next.items.push(item);
  next.plans.push(mkPlan(item.id, { mode: 'anchor', startTime: localTime(input.startTime) }));
  next.occurrences.push(mkOccurrence(item.id, startIso, endIso));
  return { data: next, itemId: item.id };
}

/** Travel-prep flow: for a destination event, create a "Leave by HH:MM"
 * unmissable hard-stop anchored at (event start − travel − buffer), linked to
 * the event with a `prep_for` relation. Returns the prep item's id. */
export function addTravelPrep(
  data: TodayData,
  eventId: ItemId,
  opts: { travelMinutes: number; bufferMinutes?: number },
): { data: TodayData; itemId: ItemId } | null {
  const next = clone(data);
  const occ = next.occurrences.find((o) => o.itemId === eventId);
  const event = next.items.find((i) => i.id === eventId);
  if (!occ || !event) return null;

  const lead = opts.travelMinutes + (opts.bufferMinutes ?? 0);
  const leaveBy = minusMinutes(occ.startsAt, lead);
  const prep = mkItem({
    title: `Leave by ${leaveBy} for ${event.title}`,
    kind: 'task',
    commitmentLevel: 'unmissable',
  });
  next.items.push(prep);
  next.plans.push(
    mkPlan(prep.id, {
      mode: 'anchor',
      startTime: localTime(leaveBy),
      relativeTo: { occurrenceId: occ.id, offsetMinutes: -lead },
    }),
  );
  const order = next.relations.filter((r) => r.relationType === 'prep_for').length;
  next.relations.push(mkRelation(prep.id, eventId, 'prep_for', order));
  return { data: next, itemId: prep.id };
}

/** Where a row can be re-targeted. A string variant carries an explicit ISO date. */
export type DayTarget = 'today' | 'tomorrow' | 'someday' | { date: string };

/** Local YYYY-MM-DD for a Date (avoids UTC off-by-one from toISOString). */
function localISODay(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Re-target an item to today / tomorrow / a specific date / someday (stash).
 * Floats the item (drops a fixed start) so the user can place it. Pure. */
export function moveToTarget(
  data: TodayData,
  itemId: ItemId,
  target: DayTarget,
  now: Date = new Date(),
): TodayData {
  const next = clone(data);
  const plan = next.plans.find((p) => p.itemId === itemId);
  if (!plan) return data;

  if (target === 'someday') {
    plan.mode = 'stash';
    delete plan.planDate;
    delete plan.startTime;
    return next;
  }

  let dateStr: string;
  if (target === 'today') {
    dateStr = localISODay(now);
  } else if (target === 'tomorrow') {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    dateStr = localISODay(t);
  } else {
    dateStr = target.date;
  }
  plan.planDate = brand<ISODate>(dateStr);
  plan.mode = 'float';
  delete plan.startTime;
  return next;
}

/** Delete an item and everything that belongs to it: its plans, occurrences,
 * relations, tag links, and (recursively) every `contains` descendant. Pure. */
export function deleteItem(data: TodayData, itemId: ItemId): TodayData {
  const next = clone(data);

  // Collect the item + all descendants via `contains` relations (transitive).
  const toRemove = new Set<ItemId>([itemId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const r of next.relations) {
      if (r.relationType === 'contains' && toRemove.has(r.fromItemId) && !toRemove.has(r.toItemId)) {
        toRemove.add(r.toItemId);
        grew = true;
      }
    }
  }

  next.items = next.items.filter((i) => !toRemove.has(i.id));
  next.plans = next.plans.filter((p) => !toRemove.has(p.itemId));
  next.occurrences = next.occurrences.filter((o) => !toRemove.has(o.itemId));
  next.relations = next.relations.filter(
    (r) => !toRemove.has(r.fromItemId) && !toRemove.has(r.toItemId),
  );
  if (next.itemTags) next.itemTags = next.itemTags.filter((t) => !toRemove.has(t.itemId));
  return next;
}

/** Pull yesterday's unfinished work onto today: any overdue/open top-level item
 * gets its plan re-dated to `now` (kept floating so the user can place it). */
export function pullYesterdayUnfinished(data: TodayData, now: Date): TodayData {
  const next = clone(data);
  const today = isoDate(now);
  let moved = 0;
  for (const plan of next.plans) {
    const item = next.items.find((i) => i.id === plan.itemId);
    if (!item || item.status === 'done' || item.status === 'archived') continue;
    if (plan.planDate && plan.planDate < today) {
      plan.planDate = today;
      plan.mode = 'float';
      delete plan.startTime;
      moved += 1;
    }
  }
  return moved > 0 ? next : data;
}
