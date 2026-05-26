export type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type UserId = Brand<string, 'UserId'>;
export type ActorId = Brand<string, 'ActorId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type ItemRelationId = Brand<string, 'ItemRelationId'>;
export type ItemAssignmentId = Brand<string, 'ItemAssignmentId'>;
export type ItemPlanId = Brand<string, 'ItemPlanId'>;
export type ItemOccurrenceId = Brand<string, 'ItemOccurrenceId'>;
export type SourceId = Brand<string, 'SourceId'>;
export type CommentId = Brand<string, 'CommentId'>;
export type FlowSessionId = Brand<string, 'FlowSessionId'>;
export type FocusSessionId = Brand<string, 'FocusSessionId'>;
export type TransitionEventId = Brand<string, 'TransitionEventId'>;
export type ReflectionId = Brand<string, 'ReflectionId'>;
export type SuggestionId = Brand<string, 'SuggestionId'>;
export type BehavioralInsightId = Brand<string, 'BehavioralInsightId'>;
export type InvitationId = Brand<string, 'InvitationId'>;
export type DeviceId = Brand<string, 'DeviceId'>;
export type NotificationPreferenceId = Brand<string, 'NotificationPreferenceId'>;
export type NotificationEventId = Brand<string, 'NotificationEventId'>;
export type NotificationDeliveryId = Brand<string, 'NotificationDeliveryId'>;
export type AppSessionId = Brand<string, 'AppSessionId'>;
export type UsageEventId = Brand<string, 'UsageEventId'>;
export type SyncCursorId = Brand<string, 'SyncCursorId'>;
export type ActivityLogId = Brand<string, 'ActivityLogId'>;
export type SyncOperationId = Brand<string, 'SyncOperationId'>;
export type InterventionId = Brand<string, 'InterventionId'>;
export type RitualId = Brand<string, 'RitualId'>;
export type CaptureEntryId = Brand<string, 'CaptureEntryId'>;

export type ISODate = Brand<string, 'ISODate'>;
export type ISODateTime = Brand<string, 'ISODateTime'>;
export type LocalTime = Brand<string, 'LocalTime'>;
export type TimeZone = Brand<string, 'TimeZone'>;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type WorkspaceKind = 'personal' | 'shared' | 'team';
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export type ActorKind =
  | 'user'
  | 'ai_agent'
  | 'coach'
  | 'accountability_partner'
  | 'integration'
  | 'system';

export type SourceKind = 'manual' | 'calendar' | 'slack' | 'email' | 'ai' | 'system';

export type ItemKind = 'task' | 'event' | 'note' | 'memory' | 'habit';
export type Bucket = 'act' | 'remember';
export type ItemStatus = 'open' | 'in_progress' | 'done' | 'skipped' | 'cancelled' | 'archived';
export type ItemVisibility = 'private' | 'workspace' | 'shared_link';
export type CommitmentLevel = 'soft' | 'firm' | 'unmissable';

export type ItemRelationType =
  | 'contains'
  | 'prep_for'
  | 'blocks'
  | 'relates_to'
  | 'generated_from'
  | 'mentioned_in'
  | 'duplicate_of';

export type AssignmentRole = 'owner' | 'assignee' | 'watcher' | 'coach' | 'accountability_partner';
export type AssignmentStatus = 'open' | 'in_progress' | 'done' | 'skipped' | 'cancelled';

export type PlanMode = 'anchor' | 'float' | 'stash';
export type OccurrenceStatus = 'confirmed' | 'tentative' | 'cancelled';
export type FlowSessionState = 'planning' | 'focusing' | 'transitioning' | 'paused' | 'reviewing' | 'done';
export type FocusSessionOutcome = 'completed' | 'paused' | 'interrupted' | 'abandoned' | 'deferred';
export type TransitionKind =
  | 'start_day'
  | 'close_item'
  | 'switch_item'
  | 'reset'
  | 'break'
  | 'resume'
  | 'end_day';
export type ReflectionKind = 'completion' | 'transition' | 'end_of_day' | 'overload' | 'freeform';
export type SuggestionKind =
  | 'reorder'
  | 'reschedule'
  | 'split'
  | 'break'
  | 'reduce_scope'
  | 'cluster'
  | 'reflect'
  | 'nudge';
export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed' | 'snoozed' | 'expired';
export type BehavioralInsightKind =
  | 'energy_pattern'
  | 'overload_pattern'
  | 'focus_window'
  | 'procrastination_pattern'
  | 'recovery_gap';
export type BehavioralInsightStatus = 'active' | 'dismissed' | 'stale' | 'archived';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type DevicePlatform = 'macos' | 'web' | 'ios' | 'android';
export type PushProvider = 'apns' | 'fcm' | 'expo' | 'web_push' | 'none';
export type NotificationChannel = 'in_app' | 'system' | 'push' | 'email';
export type NotificationTopic =
  | 'current_focus'
  | 'transition'
  | 'task_reminder'
  | 'calendar'
  | 'coach'
  | 'accountability'
  | 'ai_suggestion'
  | 'daily_review'
  | 'sync'
  | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high';
export type NotificationStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'dismissed'
  | 'failed'
  | 'cancelled';
export type AppSurface = 'desktop' | 'web' | 'mobile' | 'server';
export type SyncDirection = 'push' | 'pull';
export type SyncConflictState = 'none' | 'pending' | 'resolved' | 'needs_review';

export type InterventionStrategy =
  | 'ambient_pill'
  | 'banner'
  | 'modal_capture'
  | 'attention_takeover_torch'
  | 'breathing_reset'
  | 'escalated_alert'
  | 'silent_log';

export type InterventionSurface =
  | 'in_app'
  | 'system_notification'
  | 'screen_overlay'
  | 'sound'
  | 'push'
  | 'wearable';

export type InterventionTriggerKind =
  | 'time'
  | 'ritual'
  | 'ai_signal'
  | 'idle'
  | 'manual'
  | 'escalation';

export type InterventionIntensity = 1 | 2 | 3 | 4 | 5;

export type InterventionStatus =
  | 'scheduled'
  | 'active'
  | 'acknowledged'
  | 'dismissed'
  | 'completed_ritual'
  | 'escalated'
  | 'missed'
  | 'cancelled';

export type InterventionOutcome = 'acknowledged' | 'dismissed' | 'completed' | 'missed';

export type RitualKind =
  | 'pre_meeting_capture'
  | 'pre_meeting_focus_break'
  | 'post_meeting_reset'
  | 'pre_focus_warmup'
  | 'end_of_day_review'
  | 'custom';

export type RitualMatch = {
  itemKinds?: ItemKind[];
  titleContains?: string;
  sourceIds?: SourceId[];
  minCommitmentLevel?: CommitmentLevel;
};

export type RitualTrigger =
  | { kind: 'before_occurrence'; offsetMinutes: number; match?: RitualMatch }
  | { kind: 'after_occurrence'; offsetMinutes: number; match?: RitualMatch }
  | { kind: 'before_focus_start' }
  | { kind: 'on_transition'; from?: FlowSessionState; to?: FlowSessionState }
  | { kind: 'time_of_day'; localTime: LocalTime };

export type RitualAction =
  | { kind: 'generate_prep_item'; title: string; relationType: 'prep_for' }
  | {
      kind: 'fire_intervention';
      strategy: InterventionStrategy;
      surface: InterventionSurface;
      intensity: InterventionIntensity;
      offsetMinutes?: number;
    }
  | { kind: 'open_capture' };

export type CaptureEntryStatus = 'raw' | 'promoted' | 'dismissed';

export type RelativeTiming = {
  occurrenceId: ItemOccurrenceId;
  offsetMinutes: number;
};

export type Timestamped = {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  archivedAt?: ISODateTime;
};

export type User = Timestamped & {
  id: UserId;
  email?: string;
  displayName: string;
  avatarUrl?: string;
};

export type Workspace = Timestamped & {
  id: WorkspaceId;
  name: string;
  kind: WorkspaceKind;
  createdByActorId: ActorId;
};

export type WorkspaceMembership = {
  workspaceId: WorkspaceId;
  userId: UserId;
  role: WorkspaceRole;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type Actor = Timestamped & {
  id: ActorId;
  workspaceId: WorkspaceId;
  kind: ActorKind;
  displayName: string;
  userId?: UserId;
  metadata: JsonObject;
};

export type Source = Timestamped & {
  id: SourceId;
  workspaceId: WorkspaceId;
  kind: SourceKind;
  label: string;
  externalAccountId?: string;
  metadata: JsonObject;
};

export type Item = Timestamped & {
  id: ItemId;
  workspaceId: WorkspaceId;
  kind: ItemKind;
  bucket: Bucket;
  title: string;
  body?: string;
  status: ItemStatus;
  visibility: ItemVisibility;
  commitmentLevel: CommitmentLevel;
  sourceId?: SourceId;
  createdByActorId: ActorId;
  updatedByActorId: ActorId;
};

export type ItemRelation = {
  id: ItemRelationId;
  workspaceId: WorkspaceId;
  fromItemId: ItemId;
  toItemId: ItemId;
  relationType: ItemRelationType;
  sortOrder: number;
  createdByActorId: ActorId;
  createdAt: ISODateTime;
  archivedAt?: ISODateTime;
};

export type ItemAssignment = Timestamped & {
  id: ItemAssignmentId;
  workspaceId: WorkspaceId;
  itemId: ItemId;
  actorId: ActorId;
  role: AssignmentRole;
  status: AssignmentStatus;
  createdByActorId: ActorId;
};

export type ItemPlan = Timestamped & {
  id: ItemPlanId;
  workspaceId: WorkspaceId;
  itemId: ItemId;
  actorId: ActorId;
  planDate?: ISODate;
  mode: PlanMode;
  startTime?: LocalTime;
  endTime?: LocalTime;
  slotIndex?: number;
  slotOrder?: number;
  timezone: TimeZone;
  relativeTo?: RelativeTiming;
};

export type ItemOccurrence = Timestamped & {
  id: ItemOccurrenceId;
  workspaceId: WorkspaceId;
  itemId: ItemId;
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  timezone: TimeZone;
  status: OccurrenceStatus;
  sourceId?: SourceId;
  externalId?: string;
  recurrenceRule?: string;
};

export type Comment = Timestamped & {
  id: CommentId;
  workspaceId: WorkspaceId;
  itemId: ItemId;
  actorId: ActorId;
  body: string;
};

export type FlowSession = Timestamped & {
  id: FlowSessionId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  flowDate: ISODate;
  state: FlowSessionState;
  activeItemId?: ItemId;
};

export type FocusSession = Timestamped & {
  id: FocusSessionId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  itemId: ItemId;
  flowSessionId?: FlowSessionId;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;
  outcome?: FocusSessionOutcome;
  energyBefore?: number;
  energyAfter?: number;
  metadata: JsonObject;
};

export type TransitionEvent = {
  id: TransitionEventId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  flowSessionId: FlowSessionId;
  fromItemId?: ItemId;
  toItemId?: ItemId;
  kind: TransitionKind;
  prompt?: string;
  response?: string;
  createdAt: ISODateTime;
};

export type Reflection = Timestamped & {
  id: ReflectionId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  kind: ReflectionKind;
  itemId?: ItemId;
  flowSessionId?: FlowSessionId;
  focusSessionId?: FocusSessionId;
  mood?: string;
  energy?: number;
  body?: string;
  followUpItemId?: ItemId;
};

export type Suggestion = Timestamped & {
  id: SuggestionId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  targetActorId: ActorId;
  kind: SuggestionKind;
  title: string;
  status: SuggestionStatus;
  itemId?: ItemId;
  flowSessionId?: FlowSessionId;
  rationale?: string;
  payload: JsonObject;
};

export type BehavioralInsight = Timestamped & {
  id: BehavioralInsightId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  targetActorId: ActorId;
  kind: BehavioralInsightKind;
  title: string;
  body: string;
  status: BehavioralInsightStatus;
  confidence?: number;
  evidence: JsonObject;
};

export type Ritual = Timestamped & {
  id: RitualId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  createdByActorId: ActorId;
  kind: RitualKind;
  name: string;
  trigger: RitualTrigger;
  actions: RitualAction[];
  enabled: boolean;
};

export type Intervention = Timestamped & {
  id: InterventionId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  createdByActorId: ActorId;
  strategy: InterventionStrategy;
  surface: InterventionSurface;
  intensity: InterventionIntensity;
  triggeredBy: InterventionTriggerKind;
  itemId?: ItemId;
  occurrenceId?: ItemOccurrenceId;
  flowSessionId?: FlowSessionId;
  ritualId?: RitualId;
  scheduledFor: ISODateTime;
  activatedAt?: ISODateTime;
  resolvedAt?: ISODateTime;
  status: InterventionStatus;
  outcome?: InterventionOutcome;
  escalatesToInterventionId?: InterventionId;
  payload: JsonObject;
};

export type CaptureEntry = Timestamped & {
  id: CaptureEntryId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  body: string;
  status: CaptureEntryStatus;
  promotedItemId?: ItemId;
  transitionEventId?: TransitionEventId;
  flowSessionId?: FlowSessionId;
  capturedAt: ISODateTime;
};

export type Invitation = Timestamped & {
  id: InvitationId;
  workspaceId: WorkspaceId;
  itemId?: ItemId;
  invitedEmail?: string;
  invitedUserId?: UserId;
  invitedActorKind: Extract<ActorKind, 'user' | 'coach' | 'accountability_partner'>;
  workspaceRole?: WorkspaceRole;
  assignmentRole?: AssignmentRole;
  tokenHash: string;
  status: InvitationStatus;
  invitedByActorId: ActorId;
  acceptedByUserId?: UserId;
  expiresAt?: ISODateTime;
  acceptedAt?: ISODateTime;
};

export type Device = Timestamped & {
  id: DeviceId;
  userId: UserId;
  actorId?: ActorId;
  platform: DevicePlatform;
  appVersion?: string;
  deviceName?: string;
  pushProvider: PushProvider;
  pushTokenHash?: string;
  lastSeenAt?: ISODateTime;
};

export type NotificationPreference = Timestamped & {
  id: NotificationPreferenceId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  channel: NotificationChannel;
  topic: NotificationTopic;
  enabled: boolean;
  quietHoursStart?: LocalTime;
  quietHoursEnd?: LocalTime;
  timezone: TimeZone;
  metadata: JsonObject;
};

export type NotificationEvent = Timestamped & {
  id: NotificationEventId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  sourceActorId?: ActorId;
  topic: NotificationTopic;
  title: string;
  body?: string;
  itemId?: ItemId;
  flowSessionId?: FlowSessionId;
  suggestionId?: SuggestionId;
  scheduledFor?: ISODateTime;
  priority: NotificationPriority;
  status: NotificationStatus;
  metadata: JsonObject;
};

export type NotificationDelivery = Timestamped & {
  id: NotificationDeliveryId;
  workspaceId: WorkspaceId;
  notificationEventId: NotificationEventId;
  deviceId?: DeviceId;
  channel: NotificationChannel;
  provider?: string;
  providerMessageId?: string;
  status: NotificationStatus;
  error?: string;
  attemptedAt: ISODateTime;
};

export type AppSession = {
  id: AppSessionId;
  workspaceId?: WorkspaceId;
  actorId?: ActorId;
  deviceId?: DeviceId;
  surface: AppSurface;
  appVersion?: string;
  startedAt: ISODateTime;
  endedAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type UsageEvent = {
  id: UsageEventId;
  workspaceId?: WorkspaceId;
  actorId?: ActorId;
  appSessionId?: AppSessionId;
  eventName: string;
  properties: JsonObject;
  createdAt: ISODateTime;
};

export type ActivityLog = {
  id: ActivityLogId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  entityType:
    | 'workspace'
    | 'actor'
    | 'source'
    | 'item'
    | 'item_relation'
    | 'item_assignment'
    | 'item_plan'
    | 'item_occurrence'
    | 'comment'
    | 'flow_session'
    | 'focus_session'
    | 'transition_event'
    | 'reflection'
    | 'suggestion'
    | 'behavioral_insight'
    | 'invitation'
    | 'notification_preference'
    | 'notification_event'
    | 'notification_delivery'
    | 'ritual'
    | 'intervention'
    | 'capture_entry';
  entityId: string;
  action: string;
  before?: JsonObject;
  after?: JsonObject;
  createdAt: ISODateTime;
};

export type SyncOperation = {
  id: SyncOperationId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  deviceId?: DeviceId;
  operationType: 'create' | 'update' | 'archive' | 'restore' | 'delete';
  entityType: ActivityLog['entityType'];
  entityId: string;
  payload: JsonObject;
  localCreatedAt: ISODateTime;
  syncedAt?: ISODateTime;
  conflictState: SyncConflictState;
};

export type SyncCursor = {
  id: SyncCursorId;
  workspaceId: WorkspaceId;
  actorId: ActorId;
  deviceId: DeviceId;
  direction: SyncDirection;
  cursor: string;
  lastSyncedAt?: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type TodayItemView = {
  item: Item;
  plan?: ItemPlan;
  occurrence?: ItemOccurrence;
  assignments: ItemAssignment[];
  childProgress: {
    done: number;
    total: number;
  };
  relationBadges: ItemRelation[];
  eventState?: 'upcoming' | 'in_progress' | 'past';
  isOverdue: boolean;
  dateLabel: string;
  pendingInterventions: Intervention[];
};

export type DailyFlowView = {
  flowSession: FlowSession;
  current?: TodayItemView;
  next?: TodayItemView;
  pendingSuggestions: Suggestion[];
  activeInsights: BehavioralInsight[];
  activeInterventions: Intervention[];
  pendingCaptureEntries: CaptureEntry[];
  transitionPrompt?: string;
};
