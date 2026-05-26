import { create } from 'zustand';
import { toISODate } from '../utils/date';
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
  ISODate,
  ISODateTime,
  Intervention,
  InterventionId,
  InterventionOutcome,
  Item,
  ItemAssignment,
  ItemAssignmentId,
  ItemId,
  ItemOccurrence,
  ItemOccurrenceId,
  ItemPlan,
  ItemPlanId,
  ItemRelation,
  ItemRelationId,
  JsonObject,
  LocalTime,
  Ritual,
  RitualId,
  Source,
  SourceId,
  TimeZone,
  TransitionEventId,
  User,
  UserId,
  Workspace,
  WorkspaceId,
} from '../../shared/domain-v2';

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

function isoDateTimeFor(date: ISODate, hhmm: string): ISODateTime {
  return `${date}T${hhmm}:00.000Z` as ISODateTime;
}

const LOCAL_TZ = (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') as TimeZone;

/* ─── Seed fixture ────────────────────────────────────────────── */

const TODAY_ISO = toISODate() as ISODate;
const NOW = nowIso();

const WORKSPACE_ID: WorkspaceId = 'ws_personal' as WorkspaceId;
const USER_ID: UserId = 'user_ofer' as UserId;
const ACTOR_USER_ID: ActorId = 'actor_user_ofer' as ActorId;
const ACTOR_AI_ID: ActorId = 'actor_ai_companion' as ActorId;
const ACTOR_CALENDAR_ID: ActorId = 'actor_calendar' as ActorId;
const ACTOR_SYSTEM_ID: ActorId = 'actor_system' as ActorId;
const SOURCE_MANUAL_ID: SourceId = 'src_manual' as SourceId;
const SOURCE_CALENDAR_ID: SourceId = 'src_calendar' as SourceId;
const FLOW_SESSION_ID: FlowSessionId = 'flow_today_ofer' as FlowSessionId;

const EVENT_ITEM_ID: ItemId = 'item_1on1_manager' as ItemId;
const OCCURRENCE_ID: ItemOccurrenceId = 'occ_1on1_manager_today' as ItemOccurrenceId;
const PREP_ITEM_ID: ItemId = 'item_prep_1on1' as ItemId;
const PREP_PLAN_ID: ItemPlanId = 'plan_prep_1on1' as ItemPlanId;
const PREP_RELATION_ID: ItemRelationId = 'rel_prep_for_1on1' as ItemRelationId;
const EVENT_PLAN_ID: ItemPlanId = 'plan_event_1on1' as ItemPlanId;
const ASSIGNMENT_ID: ItemAssignmentId = 'assign_ofer_prep' as ItemAssignmentId;
const RITUAL_ID: RitualId = 'ritual_pre_1on1' as RitualId;
const INTERVENTION_CAPTURE_ID: InterventionId = 'int_capture_1on1' as InterventionId;
const INTERVENTION_TORCH_ID: InterventionId = 'int_torch_1on1' as InterventionId;
const INTERVENTION_ESCALATION_ID: InterventionId = 'int_escalation_1on1' as InterventionId;

const SEED_WORKSPACE: Workspace = {
  id: WORKSPACE_ID,
  name: 'Ofer personal',
  kind: 'personal',
  createdByActorId: ACTOR_USER_ID,
  createdAt: NOW,
  updatedAt: NOW,
};

const SEED_USER: User = {
  id: USER_ID,
  displayName: 'Ofer',
  createdAt: NOW,
  updatedAt: NOW,
};

const SEED_ACTORS: Actor[] = [
  {
    id: ACTOR_USER_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'user',
    displayName: 'Ofer',
    userId: USER_ID,
    metadata: {},
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: ACTOR_AI_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'ai_agent',
    displayName: 'Needle companion',
    metadata: {},
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: ACTOR_CALENDAR_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'integration',
    displayName: 'Calendar sync',
    metadata: { provider: 'google' },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: ACTOR_SYSTEM_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'system',
    displayName: 'Needle system',
    metadata: {},
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SEED_SOURCES: Source[] = [
  {
    id: SOURCE_MANUAL_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'manual',
    label: 'Manual capture',
    metadata: {},
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: SOURCE_CALENDAR_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'calendar',
    label: 'Calendar',
    metadata: {},
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SEED_FLOW_SESSION: FlowSession = {
  id: FLOW_SESSION_ID,
  workspaceId: WORKSPACE_ID,
  actorId: ACTOR_USER_ID,
  flowDate: TODAY_ISO,
  state: 'focusing',
  createdAt: NOW,
  updatedAt: NOW,
};

const SEED_ITEMS: Item[] = [
  {
    id: EVENT_ITEM_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'event',
    bucket: 'act',
    title: 'Manager 1:1',
    status: 'open',
    visibility: 'workspace',
    commitmentLevel: 'unmissable',
    sourceId: SOURCE_CALENDAR_ID,
    createdByActorId: ACTOR_CALENDAR_ID,
    updatedByActorId: ACTOR_CALENDAR_ID,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: PREP_ITEM_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'task',
    bucket: 'act',
    title: 'Brain-dump before 1:1',
    body: 'Capture anything on your mind so you can show up clear.',
    status: 'open',
    visibility: 'workspace',
    commitmentLevel: 'firm',
    sourceId: SOURCE_MANUAL_ID,
    createdByActorId: ACTOR_SYSTEM_ID,
    updatedByActorId: ACTOR_SYSTEM_ID,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SEED_OCCURRENCES: ItemOccurrence[] = [
  {
    id: OCCURRENCE_ID,
    workspaceId: WORKSPACE_ID,
    itemId: EVENT_ITEM_ID,
    startsAt: isoDateTimeFor(TODAY_ISO, '15:00'),
    endsAt: isoDateTimeFor(TODAY_ISO, '15:30'),
    timezone: LOCAL_TZ,
    status: 'confirmed',
    sourceId: SOURCE_CALENDAR_ID,
    externalId: 'gcal-evt-abc123',
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SEED_PLANS: ItemPlan[] = [
  {
    id: EVENT_PLAN_ID,
    workspaceId: WORKSPACE_ID,
    itemId: EVENT_ITEM_ID,
    actorId: ACTOR_USER_ID,
    planDate: TODAY_ISO,
    mode: 'anchor',
    startTime: '15:00' as LocalTime,
    endTime: '15:30' as LocalTime,
    timezone: LOCAL_TZ,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: PREP_PLAN_ID,
    workspaceId: WORKSPACE_ID,
    itemId: PREP_ITEM_ID,
    actorId: ACTOR_USER_ID,
    planDate: TODAY_ISO,
    mode: 'anchor',
    timezone: LOCAL_TZ,
    relativeTo: { occurrenceId: OCCURRENCE_ID, offsetMinutes: -5 },
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SEED_RELATIONS: ItemRelation[] = [
  {
    id: PREP_RELATION_ID,
    workspaceId: WORKSPACE_ID,
    fromItemId: PREP_ITEM_ID,
    toItemId: EVENT_ITEM_ID,
    relationType: 'prep_for',
    sortOrder: 0,
    createdByActorId: ACTOR_SYSTEM_ID,
    createdAt: NOW,
  },
];

const SEED_ASSIGNMENTS: ItemAssignment[] = [
  {
    id: ASSIGNMENT_ID,
    workspaceId: WORKSPACE_ID,
    itemId: PREP_ITEM_ID,
    actorId: ACTOR_USER_ID,
    role: 'owner',
    status: 'open',
    createdByActorId: ACTOR_USER_ID,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SEED_RITUALS: Ritual[] = [
  {
    id: RITUAL_ID,
    workspaceId: WORKSPACE_ID,
    actorId: ACTOR_USER_ID,
    createdByActorId: ACTOR_USER_ID,
    kind: 'pre_meeting_capture',
    name: '5-min brain-dump before unmissable meetings',
    trigger: {
      kind: 'before_occurrence',
      offsetMinutes: -5,
      match: { itemKinds: ['event'], minCommitmentLevel: 'unmissable' },
    },
    actions: [
      { kind: 'open_capture' },
      {
        kind: 'fire_intervention',
        strategy: 'attention_takeover_torch',
        surface: 'screen_overlay',
        intensity: 4,
        offsetMinutes: -1,
      },
    ],
    enabled: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const SEED_INTERVENTIONS: Intervention[] = [
  {
    id: INTERVENTION_CAPTURE_ID,
    workspaceId: WORKSPACE_ID,
    actorId: ACTOR_USER_ID,
    createdByActorId: ACTOR_SYSTEM_ID,
    strategy: 'modal_capture',
    surface: 'in_app',
    intensity: 2,
    triggeredBy: 'ritual',
    itemId: PREP_ITEM_ID,
    occurrenceId: OCCURRENCE_ID,
    flowSessionId: FLOW_SESSION_ID,
    ritualId: RITUAL_ID,
    scheduledFor: isoDateTimeFor(TODAY_ISO, '14:55'),
    status: 'scheduled',
    payload: { title: 'Brain-dump before Manager 1:1', subtitle: 'Anything on your mind?' },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: INTERVENTION_TORCH_ID,
    workspaceId: WORKSPACE_ID,
    actorId: ACTOR_USER_ID,
    createdByActorId: ACTOR_SYSTEM_ID,
    strategy: 'attention_takeover_torch',
    surface: 'screen_overlay',
    intensity: 4,
    triggeredBy: 'ritual',
    itemId: EVENT_ITEM_ID,
    occurrenceId: OCCURRENCE_ID,
    flowSessionId: FLOW_SESSION_ID,
    ritualId: RITUAL_ID,
    scheduledFor: isoDateTimeFor(TODAY_ISO, '14:59'),
    status: 'scheduled',
    escalatesToInterventionId: INTERVENTION_ESCALATION_ID,
    payload: {
      title: 'Manager 1:1 starting',
      subtitle: 'Move to it now.',
      targetItemId: EVENT_ITEM_ID,
    },
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: INTERVENTION_ESCALATION_ID,
    workspaceId: WORKSPACE_ID,
    actorId: ACTOR_USER_ID,
    createdByActorId: ACTOR_SYSTEM_ID,
    strategy: 'escalated_alert',
    surface: 'in_app',
    intensity: 5,
    triggeredBy: 'escalation',
    itemId: EVENT_ITEM_ID,
    occurrenceId: OCCURRENCE_ID,
    flowSessionId: FLOW_SESSION_ID,
    ritualId: RITUAL_ID,
    scheduledFor: isoDateTimeFor(TODAY_ISO, '15:00'),
    status: 'scheduled',
    payload: { title: 'Manager 1:1 is happening now', subtitle: 'You missed the heads-up.' },
    createdAt: NOW,
    updatedAt: NOW,
  },
];

/* ─── Store shape ─────────────────────────────────────────────── */

type V2State = {
  workspace: Workspace;
  user: User;
  actors: Actor[];
  sources: Source[];
  flowSessions: FlowSession[];
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
  workspace: SEED_WORKSPACE,
  user: SEED_USER,
  actors: SEED_ACTORS,
  sources: SEED_SOURCES,
  flowSessions: [SEED_FLOW_SESSION],
  items: SEED_ITEMS,
  itemRelations: SEED_RELATIONS,
  itemAssignments: SEED_ASSIGNMENTS,
  itemPlans: SEED_PLANS,
  itemOccurrences: SEED_OCCURRENCES,
  rituals: SEED_RITUALS,
  interventions: SEED_INTERVENTIONS,
  captureEntries: [],
  activityLog: [],
  meActorId: ACTOR_USER_ID,

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

/* ─── Exported seed IDs for selectors / tests ─────────────────── */

export const SEED_IDS = {
  workspace: WORKSPACE_ID,
  meActor: ACTOR_USER_ID,
  aiActor: ACTOR_AI_ID,
  calendarActor: ACTOR_CALENDAR_ID,
  systemActor: ACTOR_SYSTEM_ID,
  flowSession: FLOW_SESSION_ID,
  eventItem: EVENT_ITEM_ID,
  prepItem: PREP_ITEM_ID,
  occurrence: OCCURRENCE_ID,
  ritual: RITUAL_ID,
  interventionCapture: INTERVENTION_CAPTURE_ID,
  interventionTorch: INTERVENTION_TORCH_ID,
  interventionEscalation: INTERVENTION_ESCALATION_ID,
} as const;
