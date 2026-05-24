export type Bucket = 'act' | 'remember';

export type TimeSlot =
  | 'today'
  | 'tomorrow'
  | 'in-a-few-days'
  | 'next-week'
  | 'someday';

export type TaskKind = 'urgent' | 'upcoming' | 'faded';

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
};

export type CalendarEvent = {
  id: string;
  time: string;
  label: string;
  sublabel?: string;
};

export type CaptureState = 'typing' | 'classifying' | 'classified' | 'voice';

export type CaptureResult = {
  bucket: Bucket;
  timeSlot: TimeSlot;
  title: string;
  explanation: string;
  latencyMs: number;
};

export type Screen = 'today' | 'capture';

export type Theme = 'light' | 'dark';
