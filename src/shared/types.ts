export type Bucket = 'act' | 'remember';

export type TimeSlot =
  | 'today'
  | 'tomorrow'
  | 'in-a-few-days'
  | 'next-week'
  | 'someday';

export type TaskKind = 'urgent' | 'upcoming' | 'faded';

export type ScheduleKind = 'fixed' | 'flexible';

export type Task = {
  id: string;
  title: string;
  sublabel?: string;
  kind: TaskKind;
  date: string;
  link?: string;
  datePill?: 'urgent' | 'upcoming';
  done: boolean;
  bucket: Bucket;
  timeSlot: TimeSlot;
  rawInput?: string;
  aiReason?: string;
  scheduleKind: ScheduleKind;
  startTime?: string;  // 'HH:MM' — required for fixed tasks, absent for flexible
  slotIndex: number;   // which gap between anchors (0 = before all anchors); for flexible tasks
  slotOrder: number;   // position within slot; 0, 100, 200... (gap for easy insert); for flexible tasks
  isOverdue?: boolean;
};

export type CalendarEvent = {
  id: string;
  startTime: string;  // 'HH:MM' — drives sort order and slot boundaries
  label: string;
  sublabel?: string;
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
