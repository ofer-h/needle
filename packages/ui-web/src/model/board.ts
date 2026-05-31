/* Pure sort + group for a board. Templates declare sortBy/grouping; this turns
 * a flat TodayItemView[] into ordered, titled groups the layouts render. No
 * React. */

import type { CommitmentLevel, TodayItemView } from './domain';
import type { SortBy, Template } from './template';
import { effectiveStart } from './today';

export type ItemGroup = {
  key: string;
  title?: string;
  views: TodayItemView[];
};

const COMMITMENT_RANK: Record<CommitmentLevel, number> = { unmissable: 3, firm: 2, soft: 1 };

export function sortViews(views: TodayItemView[], sortBy: SortBy, now: Date): TodayItemView[] {
  const list = [...views];
  if (sortBy === 'manual') {
    return list.sort((a, b) => (a.plan?.slotOrder ?? 0) - (b.plan?.slotOrder ?? 0));
  }
  if (sortBy === 'priority') {
    return list.sort((a, b) => {
      const c = COMMITMENT_RANK[b.item.commitmentLevel] - COMMITMENT_RANK[a.item.commitmentLevel];
      if (c !== 0) return c;
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return startMs(a, now) - startMs(b, now);
    });
  }
  // 'time'
  return list.sort((a, b) => startMs(a, now) - startMs(b, now));
}

function startMs(v: TodayItemView, now: Date): number {
  const s = effectiveStart(v.plan, v.occurrence, now);
  return s ? s.getTime() : Number.MAX_SAFE_INTEGER;
}

function timeOfDayBucket(v: TodayItemView, now: Date): { key: string; title: string } {
  const s = effectiveStart(v.plan, v.occurrence, now);
  if (!s) return { key: 'anytime', title: 'Anytime' };
  const h = s.getHours();
  if (h < 12) return { key: 'morning', title: 'Morning' };
  if (h < 17) return { key: 'afternoon', title: 'Afternoon' };
  return { key: 'evening', title: 'Evening' };
}

const TIME_OF_DAY_ORDER = ['morning', 'afternoon', 'evening', 'anytime'];
const COMMITMENT_ORDER: { key: string; title: string; level: CommitmentLevel }[] = [
  { key: 'unmissable', title: 'Unmissable', level: 'unmissable' },
  { key: 'firm', title: 'Committed', level: 'firm' },
  { key: 'soft', title: 'Flexible', level: 'soft' },
];
const STATUS_ORDER: { key: string; title: string; match: (v: TodayItemView) => boolean }[] = [
  { key: 'open', title: 'To do', match: (v) => v.item.status === 'open' },
  { key: 'in_progress', title: 'Doing', match: (v) => v.item.status === 'in_progress' },
  { key: 'done', title: 'Done', match: (v) => v.item.status === 'done' || v.item.status === 'skipped' },
];

/** Sort, then split into the template's groups (order preserved per the group
 * scheme). Empty groups are dropped except for status (kanban wants columns). */
export function groupViews(views: TodayItemView[], template: Template, now: Date): ItemGroup[] {
  const sorted = sortViews(views, template.sortBy, now);

  if (template.grouping === 'none') {
    return [{ key: 'all', views: sorted }];
  }

  if (template.grouping === 'timeOfDay') {
    const map = new Map<string, ItemGroup>();
    for (const v of sorted) {
      const { key, title } = timeOfDayBucket(v, now);
      if (!map.has(key)) map.set(key, { key, title, views: [] });
      map.get(key)!.views.push(v);
    }
    return TIME_OF_DAY_ORDER.filter((k) => map.has(k)).map((k) => map.get(k)!);
  }

  if (template.grouping === 'commitment') {
    return COMMITMENT_ORDER.map((g) => ({
      key: g.key,
      title: g.title,
      views: sorted.filter((v) => v.item.commitmentLevel === g.level),
    })).filter((g) => g.views.length > 0);
  }

  // 'status' — keep empty columns so kanban always shows its lanes.
  return STATUS_ORDER.map((g) => ({
    key: g.key,
    title: g.title,
    views: sorted.filter((v) => g.match(v)),
  }));
}
