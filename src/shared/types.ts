export type Bucket = 'act' | 'remember';

export type TimeSlot =
  | 'today'
  | 'tomorrow'
  | 'in-a-few-days'
  | 'next-week'
  | 'someday';

export type TaskKind = 'urgent' | 'upcoming' | 'faded';

export type ScheduleKind = 'fixed' | 'flexible';

export type SourceId = 'manual' | 'calendar' | 'slack' | 'email';

export type Relation = {
  type: 'person' | 'event' | 'task';
  id: string;
  label: string;
};

export type Subtask = {
  id: string;
  title: string;
  done: boolean;
  notes?: string;
  source?: SourceId;
  sortOrder?: number;
};

export type Task = {
  id: string;
  title: string;
  sublabel?: string;
  kind: TaskKind;
  date: string | null; // YYYY-MM-DD; null means not yet planned onto a day
  dateLabel?: string;  // UI copy for the row pill, e.g. "yesterday", "anytime", "1 PM"
  link?: string;
  datePill?: 'urgent' | 'upcoming';
  done: boolean;
  bucket: Bucket;
  timeSlot: TimeSlot;
  rawInput?: string;
  aiReason?: string;
  subtasks?: Subtask[];
  notes?: string;
  leadTimeMins?: number;
  relations?: Relation[];
  source?: SourceId;
  scheduleKind: ScheduleKind;
  startTime?: string;  // 'HH:MM' — required for fixed tasks, absent for flexible
  slotIndex: number;   // which gap between anchors (0 = before all anchors); for flexible tasks
  slotOrder: number;   // position within slot; 0, 100, 200... (gap for easy insert); for flexible tasks
  isOverdue?: boolean;
};

export type CalendarEvent = {
  id: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // 'HH:MM' — drives sort order and slot boundaries
  endTime?: string;   // 'HH:MM' — later used to derive in-progress/past state
  label: string;
  sublabel?: string;
  notes?: string;
  source?: SourceId;
  relations?: Relation[];
};

export type CaptureState = 'empty' | 'typing' | 'classified' | 'voice';

export type CaptureResult = {
  bucket: Bucket;
  timeSlot: TimeSlot;
  title: string;
  explanation: string;
  latencyMs: number;
};

export type Screen = 'today' | 'capture';

export type Theme = 'light' | 'dark';

/** Persisted quick-capture inbox row (Phase F local SQLite). */
export type CaptureEntry = {
  id: string;
  body: string;
  createdAt: string;
};

export type ClassificationBucket = 'today' | 'tomorrow' | 'later' | 'someday';
export type ParsedPlanningItemType = 'task' | 'event';
export type ParsedPlanningScheduleMode = 'flexible' | 'fixed';

export type ParsedPlanningItem = {
  id: string;
  itemType: ParsedPlanningItemType;
  scheduleMode: ParsedPlanningScheduleMode;
  title: string;
  bucket: ClassificationBucket;
  suggestedDate?: string;
  suggestedTime?: string;
  reasoning: string;
  confidence: number;
};

export type ClassificationResult = {
  bucket: ClassificationBucket;
  title: string;
  suggestedDate?: string;
  suggestedTime?: string;
  reasoning: string;
  confidence: number;
  rawText?: string;
  items?: ParsedPlanningItem[];
};

export type ClassifyResponse = ClassificationResult | { error: string };
