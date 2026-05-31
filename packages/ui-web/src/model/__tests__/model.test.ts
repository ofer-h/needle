import { describe, expect, it } from 'vitest';
import {
  addChild,
  addItem,
  brand,
  buildTodayView,
  deriveCountdown,
  groupViews,
  localTime,
  mkItem,
  mkOccurrence,
  mkPlan,
  mkRelation,
  parseQuickAdd,
  pullYesterdayUnfinished,
  resetIds,
  rotateAlertStyle,
  setItemTitle,
  toggleItemDone,
  urgencyFor,
  BUILTIN_TEMPLATES,
  RevisionLog,
  type HardStop,
  type ISODateTime,
  type ItemId,
  type TodayData,
} from '../index';

const NOW = new Date('2026-05-31T09:00:00');

function iso(h: number, m: number, dayOffset = 0): ISODateTime {
  const d = new Date(NOW);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return brand<ISODateTime>(d.toISOString());
}

/** A parent task with two children (one done) + an anchored event. */
function seed(): TodayData {
  resetIds();
  const data: TodayData = { items: [], plans: [], occurrences: [], relations: [] };

  const parent = mkItem({ title: 'Parent task abc-1', kind: 'task' });
  const c1 = mkItem({ title: 'Child one', kind: 'task', status: 'done' });
  const c2 = mkItem({ title: 'Child two', kind: 'task' });
  const event = mkItem({ title: 'Standup', kind: 'event', commitmentLevel: 'firm' });

  data.items.push(parent, c1, c2, event);
  data.plans.push(mkPlan(parent.id, { mode: 'float' }));
  data.plans.push(mkPlan(event.id, { mode: 'anchor', startTime: localTime('10:30') }));
  data.occurrences.push(mkOccurrence(event.id, iso(10, 30), iso(10, 45)));
  data.relations.push(mkRelation(parent.id, c1.id, 'contains', 0));
  data.relations.push(mkRelation(parent.id, c2.id, 'contains', 1));
  return data;
}

describe('buildTodayView', () => {
  it('returns only top-level items (children are nested away)', () => {
    const views = buildTodayView(seed(), NOW);
    const titles = views.map((v) => v.item.title);
    expect(titles).toContain('Parent task abc-1');
    expect(titles).toContain('Standup');
    expect(titles).not.toContain('Child one');
    expect(views).toHaveLength(2);
  });

  it('computes child progress', () => {
    const views = buildTodayView(seed(), NOW);
    const parent = views.find((v) => v.item.title.startsWith('Parent'))!;
    expect(parent.childProgress).toEqual({ done: 1, total: 2 });
  });

  it('labels an anchored event with its clock time', () => {
    const views = buildTodayView(seed(), NOW);
    const event = views.find((v) => v.item.kind === 'event')!;
    expect(event.dateLabel).toMatch(/10:30/);
    expect(event.eventState).toBe('upcoming');
  });
});

describe('groupViews', () => {
  it('buckets by time of day under the editorial template', () => {
    const views = buildTodayView(seed(), NOW);
    const groups = groupViews(views, BUILTIN_TEMPLATES.editorial!, NOW);
    const morning = groups.find((g) => g.key === 'morning');
    const anytime = groups.find((g) => g.key === 'anytime');
    expect(morning?.views.some((v) => v.item.kind === 'event')).toBe(true);
    expect(anytime?.views.some((v) => v.item.title.startsWith('Parent'))).toBe(true);
  });
});

describe('mutations are pure (return new data, leave the input intact)', () => {
  it('toggleItemDone', () => {
    const data = seed();
    const id = data.items[0]!.id;
    const next = toggleItemDone(data, id);
    expect(data.items[0]!.status).toBe('open');
    expect(next.items[0]!.status).toBe('done');
  });

  it('setItemTitle ignores empty titles', () => {
    const data = seed();
    const id = data.items[0]!.id;
    expect(setItemTitle(data, id, '   ')).toBe(data);
    expect(setItemTitle(data, id, 'Renamed').items[0]!.title).toBe('Renamed');
  });

  it('addChild appends a contains relation', () => {
    const data = seed();
    const parentId = data.items[0]!.id;
    const next = addChild(data, parentId, 'Child three');
    const childRels = next.relations.filter(
      (r) => r.relationType === 'contains' && r.fromItemId === parentId,
    );
    expect(childRels).toHaveLength(3);
    expect(next.items.some((i) => i.title === 'Child three')).toBe(true);
  });

  it('addItem anchors when given a start time', () => {
    const { data: next, itemId } = addItem(seed(), { title: 'New', startTime: '11:00' });
    const plan = next.plans.find((p) => p.itemId === itemId)!;
    expect(plan.mode).toBe('anchor');
    expect(String(plan.startTime)).toBe('11:00');
  });

  it('pullYesterdayUnfinished re-dates overdue items to today', () => {
    const data = seed();
    const item = mkItem({ title: 'Overdue', kind: 'task' });
    data.items.push(item);
    data.plans.push(
      mkPlan(item.id, { mode: 'float', planDate: brand('2026-05-30') }),
    );
    const next = pullYesterdayUnfinished(data, NOW);
    const plan = next.plans.find((p) => p.itemId === item.id)!;
    expect(String(plan.planDate)).toBe('2026-05-31');
  });
});

describe('parseQuickAdd (mocked AI)', () => {
  it('extracts a clock time and marks it committed', () => {
    const { input } = parseQuickAdd('standup 10am');
    expect(input.startTime).toBe('10:00');
    expect(input.commitmentLevel).toBe('firm');
    expect(input.title.toLowerCase()).toContain('standup');
  });

  it('extracts a duration without mistaking it for a time', () => {
    const { input } = parseQuickAdd('deep work for 90m');
    expect(input.durationMinutes).toBe(90);
    expect(input.startTime).toBeUndefined();
  });

  it('routes "remember" to a note in the remember bucket', () => {
    const { input } = parseQuickAdd('remember to call the dentist');
    expect(input.kind).toBe('note');
    expect(input.bucket).toBe('remember');
  });

  it('nests a ** line as a subtask', () => {
    expect(parseQuickAdd('** a sub thing').level).toBe('subtask');
    expect(parseQuickAdd('a top thing').level).toBe('item');
  });
});

describe('countdown', () => {
  it('maps minutes remaining to urgency', () => {
    expect(urgencyFor(60)).toBe('calm');
    expect(urgencyFor(20)).toBe('soon');
    expect(urgencyFor(10)).toBe('imminent');
    expect(urgencyFor(0)).toBe('now');
  });

  it('rotates alert style by seed (anti-habituation)', () => {
    const a = rotateAlertStyle('imminent', 0);
    const b = rotateAlertStyle('imminent', 1);
    expect(a.id).not.toBe(b.id);
    expect(a.intensity).toBeGreaterThanOrEqual(4);
  });

  it('accounts for a leave-by buffer in the deadline', () => {
    const hardStop: HardStop = {
      itemId: brand<ItemId>('x'),
      title: 'Pickup',
      at: new Date('2026-05-31T10:00:00'),
      commitmentLevel: 'unmissable',
      leaveByMinutes: 30,
    };
    const state = deriveCountdown(hardStop, new Date('2026-05-31T09:00:00'));
    // 10:00 minus 30m buffer = 09:30 deadline, 30 minutes out.
    expect(state.minutesRemaining).toBe(30);
  });
});

describe('RevisionLog', () => {
  it('undo returns the before snapshot and marks the revision undone', () => {
    const log = new RevisionLog();
    const before = seed();
    const after = toggleItemDone(before, before.items[0]!.id);
    const rev = log.push({ actor: 'ai', summary: 'toggled', before, after });
    expect(log.undo(rev.id)).toBe(before);
    expect(log.undo(rev.id)).toBeNull(); // already undone
  });
});
