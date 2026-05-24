import { randomUUID } from 'node:crypto';
import type { CaptureResult, Task, TaskKind, TimeSlot } from '../../shared/types';
import { classifyStubWithLatency } from './classify-stub';
import { getDb } from './db';

type TaskRow = {
  id: string;
  title: string;
  raw_input: string;
  bucket: Task['bucket'];
  time_slot: TimeSlot;
  kind: TaskKind;
  done: number;
  sublabel: string | null;
  link: string | null;
  date_pill: Task['datePill'] | null;
  ai_reason: string | null;
  created_at: string;
  updated_at: string;
};

function kindFromTimeSlot(timeSlot: TimeSlot): TaskKind {
  if (timeSlot === 'today') return 'urgent';
  if (timeSlot === 'tomorrow' || timeSlot === 'in-a-few-days') return 'upcoming';
  return 'faded';
}

function dateLabel(timeSlot: TimeSlot): string {
  switch (timeSlot) {
    case 'today':
      return 'anytime';
    case 'tomorrow':
      return 'Tomorrow';
    case 'in-a-few-days':
      return 'In a few days';
    case 'next-week':
      return 'Next week';
    case 'someday':
      return 'Someday';
  }
}

function rowToTask(row: TaskRow): Task {
  const task: Task = {
    id: row.id,
    title: row.title,
    kind: row.kind,
    date: dateLabel(row.time_slot),
    done: row.done === 1,
    bucket: row.bucket,
    timeSlot: row.time_slot,
    rawInput: row.raw_input,
  };

  if (row.sublabel) task.sublabel = row.sublabel;
  if (row.link) task.link = row.link;
  if (row.date_pill) task.datePill = row.date_pill;
  if (row.ai_reason) task.aiReason = row.ai_reason;

  return task;
}

export type CreateTaskResponse = {
  task: Task;
  result: CaptureResult;
};

export function createTask(rawInput: string): CreateTaskResponse {
  const trimmed = rawInput.trim();
  if (!trimmed) throw new Error('rawInput must not be empty');

  const result = classifyStubWithLatency(trimmed);
  const now = new Date().toISOString();
  const id = randomUUID();
  const kind = kindFromTimeSlot(result.timeSlot);

  getDb()
    .prepare(
      `INSERT INTO tasks (
        id, title, raw_input, bucket, time_slot, kind, done,
        sublabel, link, date_pill, ai_reason, created_at, updated_at
      ) VALUES (
        @id, @title, @raw_input, @bucket, @time_slot, @kind, 0,
        NULL, NULL, NULL, @ai_reason, @created_at, @updated_at
      )`,
    )
    .run({
      id,
      title: result.title,
      raw_input: trimmed,
      bucket: result.bucket,
      time_slot: result.timeSlot,
      kind,
      ai_reason: result.explanation,
      created_at: now,
      updated_at: now,
    });

  const row = getDb().prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
  if (!row) throw new Error('Failed to read created task');

  return { task: rowToTask(row), result };
}

export function listTodayTasks(): Task[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM tasks
       WHERE bucket = 'act'
         AND time_slot IN ('today', 'tomorrow', 'in-a-few-days', 'next-week')
       ORDER BY
         CASE time_slot
           WHEN 'today' THEN 0
           WHEN 'tomorrow' THEN 1
           WHEN 'in-a-few-days' THEN 2
           WHEN 'next-week' THEN 3
           ELSE 4
         END,
         created_at ASC`,
    )
    .all() as TaskRow[];

  return rows.map(rowToTask);
}

export function setTaskDone(id: string, done: boolean): void {
  const row = getDb()
    .prepare('UPDATE tasks SET done = ?, updated_at = ? WHERE id = ? RETURNING id')
    .get(done ? 1 : 0, new Date().toISOString(), id) as { id: string } | undefined;

  if (!row) throw new Error(`Task not found: ${id}`);
}
