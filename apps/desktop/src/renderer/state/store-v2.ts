import { create } from 'zustand';
import type {
  ActivityLog,
  ActivityLogId,
  Actor,
  ActorId,
  CaptureEntry,
  CaptureEntryId,
  CommitmentLevel,
  FlowSession,
  FlowSessionId,
  FocusSession,
  ISODateTime,
  Intervention,
  InterventionId,
  InterventionOutcome,
  Item,
  ItemAssignment,
  ItemId,
  ItemOccurrence,
  ItemPlan,
  ItemRelation,
  JsonObject,
  Ritual,
  Source,
  TransitionEvent,
  TransitionEventId,
  User,
  Workspace,
} from '@needle/domain/domain-v2';
import { createV2Fixture, FIXTURE_IDS } from './fixture-v2';

/* ─── ID + timestamp helpers ──────────────────────────────────── */

let idCounter = 0;
function mintId<T extends string>(prefix: string): T {
  idCounter += 1;
  const stamp = Date.now().toString(36);
  const seq = idCounter.toString(36).padStart(3, '0');
  return `${prefix}_${stamp}${seq}` as T;
}

function nowIso(): ISODateTime {
  return new Date().toISOString() as ISODateTime;
}

const V2_FIXTURE = createV2Fixture();
const SOURCE_MANUAL_ID = FIXTURE_IDS.sourceManual;

/* ─── Store shape ─────────────────────────────────────────────── */

type V2State = {
  workspace: Workspace;
  user: User;
  actors: Actor[];
  sources: Source[];
  flowSessions: FlowSession[];
  focusSessions: FocusSession[];
  transitionEvents: TransitionEvent[];
  items: Item[];
  itemRelations: ItemRelation[];
  itemAssignments: ItemAssignment[];
  itemPlans: ItemPlan[];
  itemOccurrences: ItemOccurrence[];
  rituals: Ritual[];
  interventions: Intervention[];
  captureEntries: CaptureEntry[];
  activityLog: ActivityLog[];
  meActorId: ActorId;
};

type Actions = {
  scheduleIntervention: (input: Omit<Intervention, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => InterventionId;
  activateIntervention: (id: InterventionId, at: ISODateTime) => void;
  resolveIntervention: (id: InterventionId, outcome: InterventionOutcome, at: ISODateTime) => void;
  escalateIntervention: (id: InterventionId, at: ISODateTime) => InterventionId | undefined;
  addCaptureEntry: (input: {
    body: string;
    transitionEventId?: TransitionEventId;
    flowSessionId?: FlowSessionId;
  }) => CaptureEntryId;
  promoteCaptureEntry: (id: CaptureEntryId, opts?: { title?: string; commitmentLevel?: CommitmentLevel }) => ItemId | undefined;
  dismissCaptureEntry: (id: CaptureEntryId) => void;
};

export type V2Store = V2State & Actions;

/* ─── Activity log helper ─────────────────────────────────────── */

function logActivity(
  state: V2State,
  actorId: ActorId,
  entityType: ActivityLog['entityType'],
  entityId: string,
  action: string,
  before?: JsonObject,
  after?: JsonObject,
): ActivityLog[] {
  const entry: ActivityLog = {
    id: mintId<ActivityLogId>('act'),
    workspaceId: state.workspace.id,
    actorId,
    entityType,
    entityId,
    action,
    ...(before !== undefined ? { before } : {}),
    ...(after !== undefined ? { after } : {}),
    createdAt: nowIso(),
  };
  return [...state.activityLog, entry];
}

/* ─── Store ───────────────────────────────────────────────────── */

export const useV2Store = create<V2Store>((set, get) => ({
  workspace: V2_FIXTURE.workspace,
  user: V2_FIXTURE.user,
  actors: V2_FIXTURE.actors,
  sources: V2_FIXTURE.sources,
  flowSessions: V2_FIXTURE.flowSessions,
  focusSessions: V2_FIXTURE.focusSessions,
  transitionEvents: V2_FIXTURE.transitionEvents,
  items: V2_FIXTURE.items,
  itemRelations: V2_FIXTURE.itemRelations,
  itemAssignments: V2_FIXTURE.itemAssignments,
  itemPlans: V2_FIXTURE.itemPlans,
  itemOccurrences: V2_FIXTURE.itemOccurrences,
  rituals: V2_FIXTURE.rituals,
  interventions: V2_FIXTURE.interventions,
  captureEntries: V2_FIXTURE.captureEntries,
  activityLog: [],
  meActorId: V2_FIXTURE.meActorId,

  scheduleIntervention: (input) => {
    const id = mintId<InterventionId>('int');
    set((state) => {
      const intervention: Intervention = {
        ...input,
        id,
        status: 'scheduled',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      return {
        interventions: [...state.interventions, intervention],
        activityLog: logActivity(state, input.createdByActorId, 'intervention', id, 'scheduled', undefined, {
          strategy: input.strategy,
          surface: input.surface,
          scheduledFor: input.scheduledFor,
        }),
      };
    });
    return id;
  },

  activateIntervention: (id, at) => {
    set((state) => {
      const target = state.interventions.find((i) => i.id === id);
      if (!target || target.status !== 'scheduled') return {};
      const updated: Intervention = {
        ...target,
        status: 'active',
        activatedAt: at,
        updatedAt: nowIso(),
      };
      return {
        interventions: state.interventions.map((i) => (i.id === id ? updated : i)),
        activityLog: logActivity(state, state.meActorId, 'intervention', id, 'activated', { status: target.status }, { status: 'active' }),
      };
    });
  },

  resolveIntervention: (id, outcome, at) => {
    set((state) => {
      const target = state.interventions.find((i) => i.id === id);
      if (!target) return {};
      const nextStatus: Intervention['status'] =
        outcome === 'acknowledged'
          ? 'acknowledged'
          : outcome === 'dismissed'
            ? 'dismissed'
            : outcome === 'completed'
              ? 'completed_ritual'
              : 'missed';
      const updated: Intervention = {
        ...target,
        status: nextStatus,
        outcome,
        resolvedAt: at,
        updatedAt: nowIso(),
      };
      const before: JsonObject = { status: target.status };
      if (target.outcome !== undefined) before.outcome = target.outcome;
      return {
        interventions: state.interventions.map((i) => (i.id === id ? updated : i)),
        activityLog: logActivity(state, state.meActorId, 'intervention', id, 'resolved', before, { status: nextStatus, outcome }),
      };
    });
  },

  escalateIntervention: (id, at) => {
    const state = get();
    const target = state.interventions.find((i) => i.id === id);
    if (!target?.escalatesToInterventionId) return undefined;
    const next = state.interventions.find((i) => i.id === target.escalatesToInterventionId);
    if (!next) return undefined;
    set((current) => {
      const escalated: Intervention = {
        ...target,
        status: 'escalated',
        outcome: 'missed',
        resolvedAt: at,
        updatedAt: nowIso(),
      };
      const activated: Intervention = {
        ...next,
        status: 'active',
        activatedAt: at,
        triggeredBy: 'escalation',
        updatedAt: nowIso(),
      };
      const log1 = logActivity(current, current.meActorId, 'intervention', target.id, 'escalated', { status: target.status }, { status: 'escalated', outcome: 'missed' });
      const log2 = logActivity(
        { ...current, activityLog: log1 },
        current.meActorId,
        'intervention',
        next.id,
        'activated_via_escalation',
        { status: next.status },
        { status: 'active' },
      );
      return {
        interventions: current.interventions.map((i) =>
          i.id === target.id ? escalated : i.id === next.id ? activated : i,
        ),
        activityLog: log2,
      };
    });
    return next.id;
  },

  addCaptureEntry: (input) => {
    const id = mintId<CaptureEntryId>('cap');
    set((state) => {
      const entry: CaptureEntry = {
        id,
        workspaceId: state.workspace.id,
        actorId: state.meActorId,
        body: input.body,
        status: 'raw',
        ...(input.transitionEventId !== undefined ? { transitionEventId: input.transitionEventId } : {}),
        ...(input.flowSessionId !== undefined ? { flowSessionId: input.flowSessionId } : {}),
        capturedAt: nowIso(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      return {
        captureEntries: [...state.captureEntries, entry],
        activityLog: logActivity(state, state.meActorId, 'capture_entry', id, 'created', undefined, { body: input.body }),
      };
    });
    return id;
  },

  promoteCaptureEntry: (id, opts) => {
    let newItemId: ItemId | undefined;
    set((state) => {
      const entry = state.captureEntries.find((e) => e.id === id);
      if (!entry || entry.status !== 'raw') return {};
      const itemId = mintId<ItemId>('item');
      newItemId = itemId;
      const newItem: Item = {
        id: itemId,
        workspaceId: state.workspace.id,
        kind: 'task',
        bucket: 'act',
        title: opts?.title ?? entry.body.slice(0, 80),
        body: entry.body,
        status: 'open',
        visibility: 'workspace',
        commitmentLevel: opts?.commitmentLevel ?? 'firm',
        sourceId: SOURCE_MANUAL_ID,
        createdByActorId: state.meActorId,
        updatedByActorId: state.meActorId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const updatedEntry: CaptureEntry = {
        ...entry,
        status: 'promoted',
        promotedItemId: itemId,
        updatedAt: nowIso(),
      };
      const log1 = logActivity(state, state.meActorId, 'item', itemId, 'created_from_capture', undefined, { title: newItem.title });
      const log2 = logActivity(
        { ...state, activityLog: log1 },
        state.meActorId,
        'capture_entry',
        id,
        'promoted',
        { status: 'raw' },
        { status: 'promoted', promotedItemId: itemId },
      );
      return {
        items: [...state.items, newItem],
        captureEntries: state.captureEntries.map((e) => (e.id === id ? updatedEntry : e)),
        activityLog: log2,
      };
    });
    return newItemId;
  },

  dismissCaptureEntry: (id) => {
    set((state) => {
      const entry = state.captureEntries.find((e) => e.id === id);
      if (!entry || entry.status !== 'raw') return {};
      const updated: CaptureEntry = { ...entry, status: 'dismissed', updatedAt: nowIso() };
      return {
        captureEntries: state.captureEntries.map((e) => (e.id === id ? updated : e)),
        activityLog: logActivity(state, state.meActorId, 'capture_entry', id, 'dismissed', { status: 'raw' }, { status: 'dismissed' }),
      };
    });
  },
}));

export { FIXTURE_IDS as SEED_IDS } from './fixture-v2';

export { selectTodayViewModel } from './selectors-v2';
