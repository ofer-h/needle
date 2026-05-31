/* Pure board mutations. Each returns a NEW TodayData (the previous one is left
 * intact, which is what makes RevisionLog snapshots cheap + revert trivial). */

import { mkItem, mkOccurrence, mkPlan, mkRelation, isoDate, localTime } from './factory';
import { brand } from './ids';
import type { CommitmentLevel, ISODateTime, Item, ItemId, ItemKind } from './domain';
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
