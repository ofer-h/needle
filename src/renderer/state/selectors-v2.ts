import type {
  ActorId,
  DailyFlowView,
  ISODate,
  ISODateTime,
  Intervention,
  Item,
  ItemId,
  ItemOccurrence,
  ItemPlan,
  TodayItemView,
} from '../../shared/domain-v2';
import type { V2Store } from './store-v2';

/* ─── Time helpers ────────────────────────────────────────────── */

function toEpochMs(iso: ISODateTime | string): number {
  return new Date(iso).getTime();
}

function isoDateOf(iso: ISODateTime | string): string {
  return iso.slice(0, 10);
}

/* When a plan has relativeTo, derive its effective wall-clock start. */
function effectivePlanStart(plan: ItemPlan, occurrence: ItemOccurrence | undefined): ISODateTime | undefined {
  if (plan.relativeTo === undefined) return undefined;
  if (occurrence === undefined) return undefined;
  const base = toEpochMs(occurrence.startsAt);
  return new Date(base + plan.relativeTo.offsetMinutes * 60_000).toISOString() as ISODateTime;
}

function eventStateFor(occurrence: ItemOccurrence, now: ISODateTime): 'upcoming' | 'in_progress' | 'past' {
  const t = toEpochMs(now);
  const start = toEpochMs(occurrence.startsAt);
  const end = toEpochMs(occurrence.endsAt);
  if (t < start) return 'upcoming';
  if (t >= start && t < end) return 'in_progress';
  return 'past';
}

function dateLabelFor(item: Item, plan: ItemPlan | undefined, occurrence: ItemOccurrence | undefined, derivedStart: ISODateTime | undefined): string {
  if (item.kind === 'event' && occurrence !== undefined) {
    return occurrence.startsAt.slice(11, 16);
  }
  if (plan?.startTime !== undefined) return plan.startTime;
  if (derivedStart !== undefined) return derivedStart.slice(11, 16);
  if (plan?.mode === 'stash') return 'stash';
  return 'anytime';
}

/* ─── Selectors ───────────────────────────────────────────────── */

export function selectTodayItems(state: V2Store, actorId: ActorId, date: ISODate, now: ISODateTime): TodayItemView[] {
  const plans = state.itemPlans.filter((p) => p.actorId === actorId && (p.planDate === date || (p.relativeTo !== undefined)));

  const views: TodayItemView[] = [];

  for (const plan of plans) {
    const item = state.items.find((i) => i.id === plan.itemId);
    if (item === undefined) continue;

    const occurrence = state.itemOccurrences.find(
      (o) =>
        o.itemId === item.id ||
        (plan.relativeTo !== undefined && o.id === plan.relativeTo.occurrenceId),
    );

    const occForRelative =
      plan.relativeTo !== undefined
        ? state.itemOccurrences.find((o) => o.id === plan.relativeTo!.occurrenceId)
        : undefined;
    const derivedStart = effectivePlanStart(plan, occForRelative);

    if (plan.relativeTo !== undefined && derivedStart !== undefined && isoDateOf(derivedStart) !== date) continue;
    if (plan.planDate !== undefined && plan.planDate !== date && plan.relativeTo === undefined) continue;

    const assignments = state.itemAssignments.filter((a) => a.itemId === item.id);

    const childRelations = state.itemRelations.filter(
      (r) => r.fromItemId === item.id && r.relationType === 'contains' && r.archivedAt === undefined,
    );
    const childIds = new Set(childRelations.map((r) => r.toItemId));
    const childItems = state.items.filter((i) => childIds.has(i.id));
    const childProgress = {
      done: childItems.filter((c) => c.status === 'done').length,
      total: childItems.length,
    };

    const relationBadges = state.itemRelations.filter(
      (r) => r.fromItemId === item.id && r.relationType !== 'contains' && r.archivedAt === undefined,
    );

    const eventState = item.kind === 'event' && occurrence !== undefined ? eventStateFor(occurrence, now) : undefined;

    const pendingInterventions = state.interventions.filter(
      (i) =>
        i.itemId === item.id &&
        (i.status === 'scheduled' || i.status === 'active') &&
        i.archivedAt === undefined,
    );

    const isOverdue =
      item.kind === 'task' &&
      plan.planDate !== undefined &&
      plan.planDate < date &&
      item.status !== 'done';

    const view: TodayItemView = {
      item,
      plan,
      ...(occurrence !== undefined ? { occurrence } : {}),
      assignments,
      childProgress,
      relationBadges,
      ...(eventState !== undefined ? { eventState } : {}),
      isOverdue,
      dateLabel: dateLabelFor(item, plan, occurrence, derivedStart),
      pendingInterventions,
    };
    views.push(view);
  }

  views.sort((a, b) => {
    const aTime = sortKeyFor(a, state);
    const bTime = sortKeyFor(b, state);
    return aTime - bTime;
  });

  return views;
}

function sortKeyFor(view: TodayItemView, state: V2Store): number {
  if (view.occurrence !== undefined) return toEpochMs(view.occurrence.startsAt);
  if (view.plan?.relativeTo !== undefined) {
    const occ = state.itemOccurrences.find((o) => o.id === view.plan!.relativeTo!.occurrenceId);
    if (occ !== undefined) return toEpochMs(occ.startsAt) + view.plan.relativeTo.offsetMinutes * 60_000;
  }
  if (view.plan?.startTime !== undefined) {
    return Number.parseInt(view.plan.startTime.slice(0, 2), 10) * 60 + Number.parseInt(view.plan.startTime.slice(3, 5), 10);
  }
  return Number.MAX_SAFE_INTEGER;
}

export function selectActiveInterventions(state: V2Store, actorId: ActorId, now: ISODateTime): Intervention[] {
  const t = toEpochMs(now);
  return state.interventions.filter((i) => {
    if (i.actorId !== actorId) return false;
    if (i.archivedAt !== undefined) return false;
    if (i.status === 'active') return true;
    if (i.status === 'scheduled' && toEpochMs(i.scheduledFor) <= t) return true;
    return false;
  });
}

export function selectScheduledInterventions(state: V2Store, actorId: ActorId): Intervention[] {
  return state.interventions.filter(
    (i) => i.actorId === actorId && i.status === 'scheduled' && i.archivedAt === undefined,
  );
}

export function selectPendingCaptureEntries(state: V2Store, actorId: ActorId) {
  return state.captureEntries.filter((e) => e.actorId === actorId && e.status === 'raw');
}

export function selectDailyFlow(state: V2Store, actorId: ActorId, date: ISODate, now: ISODateTime): DailyFlowView {
  const flowSession =
    state.flowSessions.find((s) => s.actorId === actorId && s.flowDate === date) ??
    state.flowSessions[0]!;

  const todayViews = selectTodayItems(state, actorId, date, now);
  const activeInterventions = selectActiveInterventions(state, actorId, now);

  const t = toEpochMs(now);
  const current = todayViews.find(
    (v) => v.occurrence !== undefined && v.eventState === 'in_progress',
  ) ?? todayViews.find((v) => v.item.status === 'in_progress');
  const next = todayViews.find(
    (v) =>
      v.occurrence !== undefined &&
      toEpochMs(v.occurrence.startsAt) > t,
  );

  return {
    flowSession,
    ...(current !== undefined ? { current } : {}),
    ...(next !== undefined ? { next } : {}),
    pendingSuggestions: [],
    activeInsights: [],
    activeInterventions,
    pendingCaptureEntries: selectPendingCaptureEntries(state, actorId),
  };
}

/* ─── Lookup helpers ──────────────────────────────────────────── */

export function selectItem(state: V2Store, id: ItemId): Item | undefined {
  return state.items.find((i) => i.id === id);
}
