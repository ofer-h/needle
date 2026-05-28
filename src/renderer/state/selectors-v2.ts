import type {
  ActorId,
  DailyFlowView,
  Intervention,
  ISODate,
  ISODateTime,
  Item,
  ItemId,
  ItemOccurrence,
  ItemPlan,
  TodayItemView,
} from '@needle/domain/domain-v2';
import type { CalendarEvent, Relation, SourceId, Task, TaskKind, TimeSlot } from '@needle/domain/types';
import { buildTimeline, type TimelineItem } from '../utils/timeline';
import { addDaysISO, toISODate } from '../utils/date';
import type { V2FixtureBundle } from './fixture-v2';
import { FIXTURE_TODAY } from './fixture-v2';
import type { V2Store } from './store-v2';

/* ─── Selector state ──────────────────────────────────────────── */

export type V2SelectorState = Pick<
  V2Store,
  | 'meActorId'
  | 'items'
  | 'itemRelations'
  | 'itemAssignments'
  | 'itemPlans'
  | 'itemOccurrences'
  | 'interventions'
  | 'flowSessions'
  | 'focusSessions'
  | 'captureEntries'
>;

export function selectorStateFromFixture(fixture: V2FixtureBundle): V2SelectorState {
  return {
    meActorId: fixture.meActorId,
    items: fixture.items,
    itemRelations: fixture.itemRelations,
    itemAssignments: fixture.itemAssignments,
    itemPlans: fixture.itemPlans,
    itemOccurrences: fixture.itemOccurrences,
    interventions: fixture.interventions,
    flowSessions: fixture.flowSessions,
    focusSessions: fixture.focusSessions,
    captureEntries: fixture.captureEntries,
  };
}

/* ─── Today UI adapter (Task / CalendarEvent) ─────────────────── */

function primaryPlan(state: V2SelectorState, itemId: ItemId, actorId: ActorId): ItemPlan | undefined {
  return state.itemPlans.find((p) => p.itemId === itemId && p.actorId === actorId);
}

function childItems(state: V2SelectorState, parentId: ItemId): Item[] {
  const childIds = state.itemRelations
    .filter((r) => r.fromItemId === parentId && r.relationType === 'contains' && r.archivedAt === undefined)
    .map((r) => r.toItemId);
  return state.items.filter((i) => childIds.includes(i.id));
}

function mapSourceId(sourceId: string | undefined): SourceId | undefined {
  if (sourceId === 'src_manual') return 'manual';
  if (sourceId === 'src_calendar') return 'calendar';
  return undefined;
}

function timeSlotForPlan(plan: ItemPlan | undefined, today: ISODate): TimeSlot {
  if (plan?.mode === 'stash' || plan?.planDate === undefined) return 'someday';
  if (plan.planDate === today) return 'today';
  if (plan.planDate === addDaysISO(today, 1)) return 'tomorrow';
  if (plan.planDate > addDaysISO(today, 7)) return 'next-week';
  return 'in-a-few-days';
}

function taskKindFor(item: Item, plan: ItemPlan | undefined, today: ISODate): TaskKind {
  if (plan?.planDate !== undefined && plan.planDate < today && item.status !== 'done') return 'urgent';
  const slot = timeSlotForPlan(plan, today);
  if (slot === 'tomorrow' || slot === 'in-a-few-days') return 'faded';
  return 'upcoming';
}

function mapRelations(state: V2SelectorState, itemId: ItemId): Relation[] | undefined {
  const badges = state.itemRelations.filter(
    (r) => r.fromItemId === itemId && r.relationType !== 'contains' && r.archivedAt === undefined,
  );
  if (badges.length === 0) return undefined;
  return badges.map((r) => {
    const target = state.items.find((i) => i.id === r.toItemId);
    const type: Relation['type'] =
      r.relationType === 'prep_for' ? 'event' : r.relationType === 'mentioned_in' ? 'person' : 'task';
    return { type, id: r.toItemId, label: target?.title ?? r.toItemId };
  });
}

function mapItemToTask(state: V2SelectorState, item: Item, today: ISODate, actorId: ActorId): Task {
  const plan = primaryPlan(state, item.id, actorId);
  const occurrence = state.itemOccurrences.find((o) => o.itemId === item.id);
  const children = childItems(state, item.id);
  const planDate = plan?.planDate ?? null;
  const isOverdue = item.kind === 'task' && planDate !== null && planDate < today && item.status !== 'done';
  const timeSlot = timeSlotForPlan(plan, today);
  const prepFor = state.itemRelations.find(
    (r) => r.fromItemId === item.id && r.relationType === 'prep_for' && r.archivedAt === undefined,
  );
  const linkedEvent = prepFor !== undefined ? state.items.find((i) => i.id === prepFor.toItemId) : undefined;
  const leadTimeMins =
    plan?.relativeTo !== undefined && plan.relativeTo.offsetMinutes < 0
      ? Math.abs(plan.relativeTo.offsetMinutes)
      : undefined;

  let dateLabel = 'anytime';
  if (isOverdue) dateLabel = 'yesterday';
  else if (plan?.startTime !== undefined) dateLabel = plan.startTime;
  else if (timeSlot === 'someday') dateLabel = 'stash';
  else if (timeSlot === 'tomorrow') dateLabel = 'tomorrow';
  else if (timeSlot === 'in-a-few-days') dateLabel = 'in 3 days';

  const source = mapSourceId(item.sourceId);
  const relations = mapRelations(state, item.id);

  return {
    id: item.id,
    title: item.title,
    kind: taskKindFor(item, plan, today),
    date: planDate,
    dateLabel,
    done: item.status === 'done',
    bucket: item.bucket,
    timeSlot,
    scheduleKind: plan?.startTime !== undefined || occurrence !== undefined ? 'fixed' : 'flexible',
    slotIndex: plan?.slotIndex ?? 0,
    slotOrder: plan?.slotOrder ?? 0,
    ...(isOverdue ? { isOverdue: true, sublabel: 'from yesterday', datePill: 'urgent' as const } : {}),
    ...(linkedEvent !== undefined && plan?.startTime !== undefined
      ? { link: `${linkedEvent.title} · ${plan.startTime}` }
      : {}),
    ...(leadTimeMins !== undefined ? { leadTimeMins } : {}),
    ...(source !== undefined ? { source } : {}),
    ...(relations !== undefined ? { relations } : {}),
    ...(children.length > 0
      ? {
          subtasks: children.map((c) => ({
            id: c.id,
            title: c.title,
            done: c.status === 'done',
          })),
        }
      : {}),
    ...(plan?.startTime !== undefined ? { startTime: plan.startTime } : {}),
  };
}

function mapOccurrenceToEvent(state: V2SelectorState, occurrence: ItemOccurrence): CalendarEvent | undefined {
  const item = state.items.find((i) => i.id === occurrence.itemId);
  if (item === undefined || item.kind !== 'event') return undefined;
  const durationMins = Math.round(
    (Date.parse(occurrence.endsAt) - Date.parse(occurrence.startsAt)) / 60_000,
  );
  const source = mapSourceId(item.sourceId);
  const relations = mapRelations(state, item.id);
  return {
    id: item.id,
    date: occurrence.startsAt.slice(0, 10),
    startTime: occurrence.startsAt.slice(11, 16),
    endTime: occurrence.endsAt.slice(11, 16),
    label: item.title,
    sublabel: `${durationMins} min`,
    ...(source !== undefined ? { source } : {}),
    ...(relations !== undefined ? { relations } : {}),
  };
}

function taskItems(state: V2SelectorState): Item[] {
  const childIds = new Set(
    state.itemRelations
      .filter((r) => r.relationType === 'contains' && r.archivedAt === undefined)
      .map((r) => r.toItemId),
  );
  return state.items.filter((i) => i.kind === 'task' && !childIds.has(i.id));
}

function allTasks(state: V2SelectorState, today: ISODate, actorId: ActorId): Task[] {
  return taskItems(state).map((item) => mapItemToTask(state, item, today, actorId));
}

function todayEvents(state: V2SelectorState, today: ISODate): CalendarEvent[] {
  return state.itemOccurrences
    .filter((o) => o.startsAt.slice(0, 10) === today)
    .map((o) => mapOccurrenceToEvent(state, o))
    .filter((e): e is CalendarEvent => e !== undefined);
}

export function selectOverdueTasks(state: V2SelectorState, today: ISODate = FIXTURE_TODAY): Task[] {
  return allTasks(state, today, state.meActorId).filter((t) => t.isOverdue === true && !t.done);
}

export function selectTodayTasks(state: V2SelectorState, today: ISODate = FIXTURE_TODAY): Task[] {
  return allTasks(state, today, state.meActorId).filter((t) => t.date === today && t.isOverdue !== true);
}

export function selectTodayItems(
  state: V2SelectorState,
  today: ISODate = FIXTURE_TODAY,
): (Task | CalendarEvent)[] {
  const timeline: TimelineItem[] = buildTimeline(
    selectTodayTasks(state, today),
    todayEvents(state, today),
    today,
  );
  return timeline.map((row) => row.data);
}

export function selectUpcomingItems(state: V2SelectorState, today: ISODate = FIXTURE_TODAY): Task[] {
  return allTasks(state, today, state.meActorId).filter(
    (t) => t.date !== today && t.isOverdue !== true && !t.done,
  );
}

export function selectSubtaskProgress(
  state: V2SelectorState,
  itemId: ItemId,
): { done: number; total: number } {
  const children = childItems(state, itemId);
  return {
    done: children.filter((c) => c.status === 'done').length,
    total: children.length,
  };
}

export function selectPendingInterventions(state: V2SelectorState): Intervention[] {
  return state.interventions.filter(
    (i) =>
      i.actorId === state.meActorId &&
      i.archivedAt === undefined &&
      (i.status === 'scheduled' || i.status === 'active'),
  );
}

export function selectActiveFocusItem(state: V2SelectorState): Item | null {
  const session = state.flowSessions.find((s) => s.actorId === state.meActorId);
  if (session?.activeItemId === undefined) return null;
  return state.items.find((i) => i.id === session.activeItemId) ?? null;
}

export function selectTodayViewModel(
  state: V2SelectorState,
  today: ISODate = toISODate() as ISODate,
): { tasks: Task[]; events: CalendarEvent[] } {
  return {
    tasks: allTasks(state, today, state.meActorId),
    events: todayEvents(state, today),
  };
}

/* ─── V2-native flow selectors ────────────────────────────────── */

function toEpochMs(iso: ISODateTime | string): number {
  return new Date(iso).getTime();
}

function isoDateOf(iso: ISODateTime | string): string {
  return iso.slice(0, 10);
}

function effectivePlanStart(plan: ItemPlan, occurrence: ItemOccurrence | undefined): ISODateTime | undefined {
  if (plan.relativeTo === undefined || occurrence === undefined) return undefined;
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

function dateLabelForView(
  item: Item,
  plan: ItemPlan | undefined,
  occurrence: ItemOccurrence | undefined,
  derivedStart: ISODateTime | undefined,
): string {
  if (item.kind === 'event' && occurrence !== undefined) return occurrence.startsAt.slice(11, 16);
  if (plan?.startTime !== undefined) return plan.startTime;
  if (derivedStart !== undefined) return derivedStart.slice(11, 16);
  if (plan?.mode === 'stash') return 'stash';
  return 'anytime';
}

export function selectTodayItemViews(
  state: V2Store,
  actorId: ActorId,
  date: ISODate,
  now: ISODateTime,
): TodayItemView[] {
  const plans = state.itemPlans.filter(
    (p) => p.actorId === actorId && (p.planDate === date || p.relativeTo !== undefined),
  );
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

    if (plan.relativeTo !== undefined && derivedStart !== undefined && isoDateOf(derivedStart) !== date) {
      continue;
    }
    if (plan.planDate !== undefined && plan.planDate !== date && plan.relativeTo === undefined) continue;

    const childRelations = state.itemRelations.filter(
      (r) => r.fromItemId === item.id && r.relationType === 'contains' && r.archivedAt === undefined,
    );
    const childIds = new Set(childRelations.map((r) => r.toItemId));
    const childItemRows = state.items.filter((i) => childIds.has(i.id));

    views.push({
      item,
      plan,
      ...(occurrence !== undefined ? { occurrence } : {}),
      assignments: state.itemAssignments.filter((a) => a.itemId === item.id),
      childProgress: {
        done: childItemRows.filter((c) => c.status === 'done').length,
        total: childItemRows.length,
      },
      relationBadges: state.itemRelations.filter(
        (r) => r.fromItemId === item.id && r.relationType !== 'contains' && r.archivedAt === undefined,
      ),
      ...(item.kind === 'event' && occurrence !== undefined
        ? { eventState: eventStateFor(occurrence, now) }
        : {}),
      isOverdue:
        item.kind === 'task' &&
        plan.planDate !== undefined &&
        plan.planDate < date &&
        item.status !== 'done',
      dateLabel: dateLabelForView(item, plan, occurrence, derivedStart),
      pendingInterventions: state.interventions.filter(
        (i) =>
          i.itemId === item.id &&
          (i.status === 'scheduled' || i.status === 'active') &&
          i.archivedAt === undefined,
      ),
    });
  }

  views.sort((a, b) => sortKeyForView(a, state) - sortKeyForView(b, state));
  return views;
}

function sortKeyForView(view: TodayItemView, state: V2Store): number {
  if (view.occurrence !== undefined) return toEpochMs(view.occurrence.startsAt);
  if (view.plan?.relativeTo !== undefined) {
    const occ = state.itemOccurrences.find((o) => o.id === view.plan!.relativeTo!.occurrenceId);
    if (occ !== undefined) return toEpochMs(occ.startsAt) + view.plan.relativeTo.offsetMinutes * 60_000;
  }
  if (view.plan?.startTime !== undefined) {
    return (
      Number.parseInt(view.plan.startTime.slice(0, 2), 10) * 60 +
      Number.parseInt(view.plan.startTime.slice(3, 5), 10)
    );
  }
  return Number.MAX_SAFE_INTEGER;
}

export function selectActiveInterventions(
  state: V2Store,
  actorId: ActorId,
  now: ISODateTime,
): Intervention[] {
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

export function selectDailyFlow(
  state: V2Store,
  actorId: ActorId,
  date: ISODate,
  now: ISODateTime,
): DailyFlowView {
  const flowSession =
    state.flowSessions.find((s) => s.actorId === actorId && s.flowDate === date) ??
    state.flowSessions[0]!;
  const todayViews = selectTodayItemViews(state, actorId, date, now);
  const activeInterventions = selectActiveInterventions(state, actorId, now);
  const t = toEpochMs(now);
  const current =
    todayViews.find((v) => v.occurrence !== undefined && v.eventState === 'in_progress') ??
    todayViews.find((v) => v.item.status === 'in_progress');
  const next = todayViews.find(
    (v) => v.occurrence !== undefined && toEpochMs(v.occurrence.startsAt) > t,
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

export function selectItem(state: V2Store, id: ItemId): Item | undefined {
  return state.items.find((i) => i.id === id);
}
