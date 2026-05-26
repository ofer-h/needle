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
export type ActivityLogId = Brand<string, 'ActivityLogId'>;
export type SyncOperationId = Brand<string, 'SyncOperationId'>;

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
export type SyncConflictState = 'none' | 'pending' | 'resolved' | 'needs_review';

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
    | 'comment';
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
  operationType: 'create' | 'update' | 'archive' | 'restore' | 'delete';
  entityType: ActivityLog['entityType'];
  entityId: string;
  payload: JsonObject;
  localCreatedAt: ISODateTime;
  syncedAt?: ISODateTime;
  conflictState: SyncConflictState;
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
};
