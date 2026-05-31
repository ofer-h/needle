/* Deterministic demo data, authored as canonical @needle/domain entities via the
 * ui-web factories. Times are anchored to "today" so the timeline + countdowns
 * read naturally. Covers: a standup, an unmissable kids-pickup alarm, a
 * subtasked task with a `task-123` ref, flexible work, an overdue item from
 * yesterday (for "pull yesterday"), and a remembered note. */

import {
  brand,
  isoDate,
  localTime,
  mkItem,
  mkOccurrence,
  mkPlan,
  mkRelation,
  resetIds,
  type ISODateTime,
  type ItemId,
  type TodayData,
} from '@needle/ui-web';

function at(h: number, m: number, dayOffset = 0): ISODateTime {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return brand<ISODateTime>(d.toISOString());
}

export function makeSeed(): TodayData {
  resetIds();
  const data: TodayData = { items: [], plans: [], occurrences: [], relations: [] };

  const add = (...items: ReturnType<typeof mkItem>[]) => data.items.push(...items);

  // 1. Morning standup — fixed event, committed.
  const standup = mkItem({ title: 'Team standup', kind: 'event', commitmentLevel: 'firm' });
  add(standup);
  data.plans.push(mkPlan(standup.id, { mode: 'anchor', startTime: localTime('10:30') }));
  data.occurrences.push(mkOccurrence(standup.id, at(10, 30), at(10, 45)));

  // 2. Subtasked task with a ticket ref + progress.
  const onboarding = mkItem({ title: 'Ship the onboarding flow task-123', kind: 'task' });
  add(onboarding);
  data.plans.push(mkPlan(onboarding.id, { mode: 'float' }));
  const children: { title: string; done: boolean }[] = [
    { title: 'Write the welcome copy', done: true },
    { title: 'Wire the /signup API', done: false },
    { title: 'QA on a fresh account', done: false },
  ];
  children.forEach((c, i) => {
    const child = mkItem({ title: c.title, kind: 'task', status: c.done ? 'done' : 'open' });
    add(child);
    data.relations.push(mkRelation(onboarding.id, child.id, 'contains', i));
  });

  // 3. A couple of flexible tasks.
  const review = mkItem({ title: 'Review the Q3 roadmap doc', kind: 'task' });
  const email = mkItem({ title: 'Reply to Dana about the contract', kind: 'task' });
  add(review, email);
  data.plans.push(mkPlan(review.id, { mode: 'float' }));
  data.plans.push(mkPlan(email.id, { mode: 'float' }));

  // 4. Kids pickup — unmissable alarm later today (prep flow lands in Phase 2).
  const pickup = mkItem({ title: 'Pick up the kids', kind: 'event', commitmentLevel: 'unmissable' });
  add(pickup);
  data.plans.push(mkPlan(pickup.id, { mode: 'anchor', startTime: localTime('14:00') }));
  data.occurrences.push(mkOccurrence(pickup.id, at(14, 0), at(14, 30)));

  // 5. Overdue carry-over from yesterday (drives "pull yesterday's unfinished").
  const overdue = mkItem({ title: 'Send the invoice to Acme', kind: 'task' });
  add(overdue);
  data.plans.push(
    mkPlan(overdue.id, { mode: 'float', planDate: isoDate(new Date(Date.now() - 864e5)) }),
  );

  // 6. A remembered note (act/remember split).
  const note = mkItem({
    title: 'Idea: a calmer Sunday review ritual',
    kind: 'note',
    bucket: 'remember',
  });
  add(note);
  data.plans.push(mkPlan(note.id, { mode: 'stash' }));

  return data;
}

/** Item ids worth referencing from scenarios (e.g. countdown targets later). */
export type SeedHandles = { kidsPickup?: ItemId };
