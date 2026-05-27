import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { CalendarEvent, CaptureEntry, Relation, Subtask, Task } from '../../shared/types';
import { getDb } from './index';

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  date: string | null;
  date_label: string | null;
  time_slot: string;
  bucket: string;
  kind: string;
  start_time: string | null;
  slot_index: number;
  slot_order: number;
  is_overdue: number;
  is_complete: number;
  subtasks: string | null;
  source: string | null;
  lead_time_mins: number | null;
  schedule_kind: string;
  sublabel: string | null;
  link: string | null;
  date_pill: string | null;
  raw_input: string | null;
  ai_reason: string | null;
  relations: string | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  label: string;
  date: string;
  start_time: string;
  end_time: string | null;
  sublabel: string | null;
  source: string | null;
  relations: string | null;
  created_at: string;
};

type CaptureRow = {
  id: string;
  body: string;
  created_at: string;
};

function parseJson<T>(value: string | null): T | undefined {
  if (value === null || value === '') return undefined;
  return JSON.parse(value) as T;
}

function rowToTask(row: TaskRow): Task {
  const task: Task = {
    id: row.id,
    title: row.title,
    kind: row.kind as Task['kind'],
    date: row.date,
    done: row.is_complete === 1,
    bucket: row.bucket as Task['bucket'],
    timeSlot: row.time_slot as Task['timeSlot'],
    scheduleKind: row.schedule_kind as Task['scheduleKind'],
    slotIndex: row.slot_index,
    slotOrder: row.slot_order,
  };

  if (row.notes !== null) task.notes = row.notes;
  if (row.date_label !== null) task.dateLabel = row.date_label;
  if (row.start_time !== null) task.startTime = row.start_time;
  if (row.is_overdue === 1) task.isOverdue = true;
  const subtasks = parseJson<Subtask[]>(row.subtasks);
  if (subtasks !== undefined) task.subtasks = subtasks;
  if (row.source !== null) {
    task.source = row.source as NonNullable<Task['source']>;
  }
  if (row.lead_time_mins !== null) task.leadTimeMins = row.lead_time_mins;
  if (row.sublabel !== null) task.sublabel = row.sublabel;
  if (row.link !== null) task.link = row.link;
  if (row.date_pill !== null) {
    task.datePill = row.date_pill as NonNullable<Task['datePill']>;
  }
  if (row.raw_input !== null) task.rawInput = row.raw_input;
  if (row.ai_reason !== null) task.aiReason = row.ai_reason;
  const relations = parseJson<Relation[]>(row.relations);
  if (relations !== undefined) task.relations = relations;

  return task;
}

function taskToRow(task: Task, timestamps: { createdAt: string; updatedAt: string }): TaskRow {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes ?? null,
    date: task.date,
    date_label: task.dateLabel ?? null,
    time_slot: task.timeSlot,
    bucket: task.bucket,
    kind: task.kind,
    start_time: task.startTime ?? null,
    slot_index: task.slotIndex,
    slot_order: task.slotOrder,
    is_overdue: task.isOverdue ? 1 : 0,
    is_complete: task.done ? 1 : 0,
    subtasks: task.subtasks !== undefined ? JSON.stringify(task.subtasks) : null,
    source: task.source ?? null,
    lead_time_mins: task.leadTimeMins ?? null,
    schedule_kind: task.scheduleKind,
    sublabel: task.sublabel ?? null,
    link: task.link ?? null,
    date_pill: task.datePill ?? null,
    raw_input: task.rawInput ?? null,
    ai_reason: task.aiReason ?? null,
    relations: task.relations !== undefined ? JSON.stringify(task.relations) : null,
    created_at: timestamps.createdAt,
    updated_at: timestamps.updatedAt,
  };
}

function rowToEvent(row: EventRow): CalendarEvent {
  const event: CalendarEvent = {
    id: row.id,
    date: row.date,
    startTime: row.start_time,
    label: row.label,
  };
  if (row.end_time !== null) event.endTime = row.end_time;
  if (row.sublabel !== null) event.sublabel = row.sublabel;
  if (row.source !== null) {
    event.source = row.source as NonNullable<CalendarEvent['source']>;
  }
  const relations = parseJson<Relation[]>(row.relations);
  if (relations !== undefined) event.relations = relations;
  return event;
}

function eventToRow(
  event: CalendarEvent,
  createdAt: string,
): Omit<EventRow, 'created_at'> & { created_at: string } {
  return {
    id: event.id,
    label: event.label,
    date: event.date,
    start_time: event.startTime,
    end_time: event.endTime ?? null,
    sublabel: event.sublabel ?? null,
    source: event.source ?? null,
    relations: event.relations !== undefined ? JSON.stringify(event.relations) : null,
    created_at: createdAt,
  };
}

function dbOr(conn?: Database.Database): Database.Database {
  return conn ?? getDb();
}

const SELECT_TASK = `
  SELECT id, title, notes, date, date_label, time_slot, bucket, kind, start_time,
         slot_index, slot_order, is_overdue, is_complete, subtasks, source,
         lead_time_mins, schedule_kind, sublabel, link, date_pill, raw_input,
         ai_reason, relations, created_at, updated_at
  FROM tasks
`;

export function getAllTasks(conn?: Database.Database): Task[] {
  const rows = dbOr(conn).prepare(`${SELECT_TASK} ORDER BY slot_index, slot_order`).all() as TaskRow[];
  return rows.map(rowToTask);
}

export function getTasksByDate(date: string, conn?: Database.Database): Task[] {
  const rows = dbOr(conn)
    .prepare(`${SELECT_TASK} WHERE date = ? ORDER BY slot_index, slot_order`)
    .all(date) as TaskRow[];
  return rows.map(rowToTask);
}

export function createTask(
  input: Omit<Task, 'id'> & { id?: string },
  conn?: Database.Database,
): Task {
  const database = dbOr(conn);
  const now = new Date().toISOString();
  const task: Task = { ...input, id: input.id ?? randomUUID() };
  const row = taskToRow(task, { createdAt: now, updatedAt: now });

  database
    .prepare(
      `INSERT INTO tasks (
        id, title, notes, date, date_label, time_slot, bucket, kind, start_time,
        slot_index, slot_order, is_overdue, is_complete, subtasks, source,
        lead_time_mins, schedule_kind, sublabel, link, date_pill, raw_input,
        ai_reason, relations, created_at, updated_at
      ) VALUES (
        @id, @title, @notes, @date, @date_label, @time_slot, @bucket, @kind, @start_time,
        @slot_index, @slot_order, @is_overdue, @is_complete, @subtasks, @source,
        @lead_time_mins, @schedule_kind, @sublabel, @link, @date_pill, @raw_input,
        @ai_reason, @relations, @created_at, @updated_at
      )`,
    )
    .run(row);

  return task;
}

export function updateTask(id: string, patch: Partial<Task>, conn?: Database.Database): Task {
  const database = dbOr(conn);
  const existing = database.prepare(`${SELECT_TASK} WHERE id = ?`).get(id) as TaskRow | undefined;
  if (!existing) {
    throw new Error(`Task not found: ${id}`);
  }

  const merged: Task = { ...rowToTask(existing), ...patch, id };
  const row = taskToRow(merged, {
    createdAt: existing.created_at,
    updatedAt: new Date().toISOString(),
  });

  database
    .prepare(
      `UPDATE tasks SET
        title = @title, notes = @notes, date = @date, date_label = @date_label,
        time_slot = @time_slot, bucket = @bucket, kind = @kind, start_time = @start_time,
        slot_index = @slot_index, slot_order = @slot_order, is_overdue = @is_overdue,
        is_complete = @is_complete, subtasks = @subtasks, source = @source,
        lead_time_mins = @lead_time_mins, schedule_kind = @schedule_kind,
        sublabel = @sublabel, link = @link, date_pill = @date_pill,
        raw_input = @raw_input, ai_reason = @ai_reason, relations = @relations,
        updated_at = @updated_at
      WHERE id = @id`,
    )
    .run(row);

  return merged;
}

export function deleteTask(id: string, conn?: Database.Database): void {
  const result = dbOr(conn).prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (result.changes === 0) {
    throw new Error(`Task not found: ${id}`);
  }
}

export function getAllEvents(conn?: Database.Database): CalendarEvent[] {
  const rows = dbOr(conn)
    .prepare(
      `SELECT id, label, date, start_time, end_time, sublabel, source, relations, created_at
       FROM calendar_events ORDER BY date, start_time`,
    )
    .all() as EventRow[];
  return rows.map(rowToEvent);
}

export function getEventsByDate(date: string, conn?: Database.Database): CalendarEvent[] {
  const rows = dbOr(conn)
    .prepare(
      `SELECT id, label, date, start_time, end_time, sublabel, source, relations, created_at
       FROM calendar_events WHERE date = ? ORDER BY start_time`,
    )
    .all(date) as EventRow[];
  return rows.map(rowToEvent);
}

export function createEvent(
  input: Omit<CalendarEvent, 'id'> & { id?: string },
  conn?: Database.Database,
): CalendarEvent {
  const database = dbOr(conn);
  const now = new Date().toISOString();
  const event: CalendarEvent = { ...input, id: input.id ?? randomUUID() };
  const row = eventToRow(event, now);

  database
    .prepare(
      `INSERT INTO calendar_events (
        id, label, date, start_time, end_time, sublabel, source, relations, created_at
      ) VALUES (
        @id, @label, @date, @start_time, @end_time, @sublabel, @source, @relations, @created_at
      )`,
    )
    .run(row);

  return event;
}

export function createCaptureEntry(
  entry: { body: string },
  conn?: Database.Database,
): CaptureEntry {
  const database = dbOr(conn);
  const now = new Date().toISOString();
  const capture: CaptureEntry = {
    id: randomUUID(),
    body: entry.body,
    createdAt: now,
  };

  database
    .prepare('INSERT INTO capture_entries (id, body, created_at) VALUES (?, ?, ?)')
    .run(capture.id, capture.body, capture.createdAt);

  return capture;
}

export function getRecentCaptureEntries(limit = 50, conn?: Database.Database): CaptureEntry[] {
  const rows = dbOr(conn)
    .prepare(
      `SELECT id, body, created_at FROM capture_entries
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(limit) as CaptureRow[];

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export function countTasks(conn?: Database.Database): number {
  const row = dbOr(conn).prepare('SELECT COUNT(*) AS count FROM tasks').get() as { count: number };
  return row.count;
}
