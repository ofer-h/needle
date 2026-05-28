import type { FlowHealthSnapshot } from '@needle/domain/flow-health';
import type { CalendarEvent, CaptureEntry, ClassifyResponse, ParsedPlanningItem, Task, Theme } from '@needle/domain/types';

export type TorchShowPayload = {
  /** Stable correlation id provided by the requester. Used to match the close
   * notification back to the source intervention. */
  correlationId: string;
  title: string;
  subtitle: string;
  /** Auto-timeout in milliseconds. When elapsed without acknowledge, the torch
   * window emits `torch:dismiss` with reason `'timeout'`. */
  durationMs: number;
  /** When true the hero banner shows meeting-safe skip reason labels. */
  isMeeting?: boolean;
  /** HH:MM local time of the linked meeting occurrence. Banner uses this to
   * render a live "in Xm" countdown next to the title. */
  meetingStartTime?: string;
};

export type TorchDismissReason = 'acknowledged' | 'timeout' | 'skipped';

export type TorchClosePayload = {
  reason: TorchDismissReason;
  correlationId: string;
  /** Present when reason is 'skipped'. Human-readable skip category. */
  skipReason?: string;
  /** Optional free-text notes entered by the user when skipping. */
  skipNotes?: string;
  /** Present when the user submitted a brain dump before dismissing. */
  brainDumpText?: string;
};

export type TorchSnoozePayload = {
  correlationId: string;
  /** How long to hold the overlay at near-zero intensity before re-escalating. */
  snoozeMs: number;
};

/** Broadcasted from main to all torch overlay windows and the hero banner
 * to switch between ambient-dim mode, interactive skip mode, and brain-dump mode. */
export type TorchHeroPayload = {
  mode: 'skip' | 'brain-dump' | 'normal';
};

export type TorchBrainDumpSubmitPayload = {
  correlationId: string;
  text: string;
};

/** Sent from a torch overlay renderer to toggle that window's click-through state.
 * Main identifies the sender via event.sender and calls setIgnoreMouseEvents accordingly. */
export type TorchSetInteractivePayload = {
  /** true → window receives clicks; false → window is pass-through (forward: true) */
  interactive: boolean;
};

export type TorchSkipConfirmPayload = {
  correlationId: string;
  reason: string;
  notes?: string;
};

export type CaptureShowPayload = {
  correlationId: string;
  title: string;
  subtitle: string;
};

export type CaptureEntryPayload = {
  correlationId: string;
  /** Stable local id minted by the capture window, surfaced back so promote/dismiss can reference it. */
  entryId: string;
  body: string;
};

export type CapturePromotePayload = {
  correlationId: string;
  entryId: string;
};

export type CaptureCloseReason = 'completed' | 'dismissed';

export type CaptureClosePayload = {
  correlationId: string;
  reason: CaptureCloseReason;
};

export type DbUpdateTaskPayload = { id: string; patch: Partial<Task> };
export type DbDeleteTaskPayload = { id: string };
export type DbAddSubtaskPayload = { taskId: string; title: string };
export type DbSubtaskPayload = { taskId: string; subtaskId: string };
export type DbUpdateSubtaskPayload = {
  taskId: string;
  subtaskId: string;
  patch: { title?: string; notes?: string };
};
export type DbReorderSubtaskPayload = {
  taskId: string;
  subtaskId: string;
  toIndex: number;
};
export type DbMoveSubtaskPayload = {
  taskId: string;
  subtaskId: string;
  targetTaskId: string;
};
export type DbNestTaskPayload = {
  taskId: string;
  targetTaskId: string;
};
export type DbUpdateEventPayload = {
  id: string;
  patch: Partial<CalendarEvent>;
};
export type DbDeleteEventPayload = { id: string };
export type DbConvertEventPayload = { id: string };
export type DbAddCapturePayload = { body: string };
export type DbGetCapturePayload = { limit?: number };
export type DbCreatePlanningItemsPayload = {
  rawInput: string;
  items: ParsedPlanningItem[];
};
export type DbCreatePlanningItemsResponse = {
  tasks: Task[];
  events: CalendarEvent[];
};

export type AiClassifyPayload = {
  text: string;
};

export type AiSetApiKeyPayload = {
  apiKey: string;
};

export type AppDiagnostics = {
  version: string;
  gitSha: string;
  isPackaged: boolean;
  envFilePath: string | null;
  envFileLoaded: boolean;
  apiKeySource: 'env' | 'config' | 'none';
  hasApiKey: boolean;
};

export type IpcContracts = {
  'app:getTheme': { req: void; res: Theme };
  'app:getDiagnostics': { req: void; res: AppDiagnostics };
  'app:getFlowHealth': { req: void; res: FlowHealthSnapshot };
  'db:get-tasks': { req: void; res: Task[] };
  'db:update-task': { req: DbUpdateTaskPayload; res: Task };
  'db:delete-task': { req: DbDeleteTaskPayload; res: void };
  'db:add-subtask': { req: DbAddSubtaskPayload; res: Task };
  'db:toggle-subtask': { req: DbSubtaskPayload; res: Task };
  'db:remove-subtask': { req: DbSubtaskPayload; res: Task };
  'db:update-subtask': { req: DbUpdateSubtaskPayload; res: Task };
  'db:reorder-subtask': { req: DbReorderSubtaskPayload; res: void };
  'db:move-subtask': { req: DbMoveSubtaskPayload; res: void };
  'db:promote-subtask': { req: DbSubtaskPayload; res: void };
  'db:nest-task': { req: DbNestTaskPayload; res: void };
  'db:get-events': { req: void; res: CalendarEvent[] };
  'db:update-event': { req: DbUpdateEventPayload; res: CalendarEvent };
  'db:delete-event': { req: DbDeleteEventPayload; res: void };
  'db:convert-event-to-task': { req: DbConvertEventPayload; res: void };
  'db:create-planning-items': { req: DbCreatePlanningItemsPayload; res: DbCreatePlanningItemsResponse };
  'db:add-capture': { req: DbAddCapturePayload; res: CaptureEntry };
  'db:get-capture-entries': { req: DbGetCapturePayload; res: CaptureEntry[] };
  'ai:classify': { req: AiClassifyPayload; res: ClassifyResponse };
  'ai:setApiKey': { req: AiSetApiKeyPayload; res: { ok: true } | { error: string } };
  'ai:hasApiKey': { req: void; res: boolean };
};
