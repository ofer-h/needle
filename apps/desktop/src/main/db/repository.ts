import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type {
  CalendarEvent,
  CaptureEntry,
  ClassificationBucket,
  ParsedPlanningItem,
  Task,
} from '@needle/domain/types';
import { getDb } from './index';

const DEFAULT_WORKSPACE_ID = 'ws_personal';
const DEFAULT_ACTOR_ID = 'actor_user_ofer';
const DEFAULT_MANUAL_SOURCE_ID = 'src_manual';
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

type CaptureEntryRow = {
  id: string;
  body: string;
  captured_at: string;
};

type V2TaskRow = {
  item_id: string;
  title: string;
  body: string | null;
  status: string;
  bucket: string;
  source_id: string | null;
  plan_date: string | null;
  mode: string;
  start_time: string | null;
  slot_index: number | null;
  slot_order: number | null;
  raw_input: string | null;
  reasoning: string | null;
};

type V2EventRow = {
  item_id: string;
  title: string;
  body: string | null;
  source_id: string | null;
  starts_at: string;
  ends_at: string;
  reasoning: string | null;
};

type V2SubtaskRow = {
  parent_item_id: string;
  child_item_id: string;
  title: string;
  body: string | null;
  source_id: string | null;
  status: string;
  sort_order: number;
};

function parseJson<T>(value: string | null): T | undefined {
  if (value === null || value === '') return undefined;
  return JSON.parse(value) as T;
}

function dbOr(conn?: Database.Database): Database.Database {
  return conn ?? getDb();
}

function dateForBucket(bucket: ClassificationBucket, now = new Date()): string | null {
  const today = toISODate(now);
  if (bucket === 'today') return today;
  if (bucket === 'tomorrow') return addDaysISO(today, 1);
  if (bucket === 'later') return addDaysISO(today, 3);
  return null;
}

function toISODate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysISO(isoDate: string, days: number): string {
  const date = new Date(Number(isoDate.slice(0, 4)), Number(isoDate.slice(5, 7)) - 1, Number(isoDate.slice(8, 10)));
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function isoDateTimeForLocal(date: string, hhmm: string): string {
  const local = new Date(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Number(hhmm.slice(0, 2)),
    Number(hhmm.slice(3, 5)),
  );
  return local.toISOString();
}

function localDateFromIso(iso: string): string {
  return toISODate(new Date(iso));
}

function localTimeFromIso(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function sourceIdToView(sourceId: string | null): Task['source'] | undefined {
  if (sourceId === DEFAULT_MANUAL_SOURCE_ID) return 'manual';
  if (sourceId === 'src_calendar') return 'calendar';
  return undefined;
}

function dateLabelForV2(planDate: string | null, startTime: string | null, mode: string): string {
  if (startTime !== null) return startTime;
  if (mode === 'stash' || planDate === null) return 'stash';
  const today = toISODate();
  if (planDate === today) return 'today';
  if (planDate === addDaysISO(today, 1)) return 'tomorrow';
  return planDate;
}

function v2TaskRowToTask(row: V2TaskRow): Task {
  const source = sourceIdToView(row.source_id);
  const isOverdue = row.plan_date !== null && row.plan_date < toISODate() && row.status !== 'done';
  const timeSlot =
    row.plan_date === null || row.mode === 'stash'
      ? 'someday'
      : isOverdue || row.plan_date === toISODate()
        ? 'today'
        : row.plan_date === addDaysISO(toISODate(), 1)
          ? 'tomorrow'
          : 'in-a-few-days';
  const task: Task = {
    id: row.item_id,
    title: row.title,
    kind: isOverdue ? 'urgent' : timeSlot === 'today' ? 'upcoming' : 'faded',
    date: row.plan_date,
    dateLabel: isOverdue ? 'yesterday' : dateLabelForV2(row.plan_date, row.start_time, row.mode),
    done: row.status === 'done',
    bucket: row.bucket as Task['bucket'],
    timeSlot,
    scheduleKind: row.mode === 'anchor' ? 'fixed' : 'flexible',
    slotIndex: row.slot_index ?? 0,
    slotOrder: row.slot_order ?? 0,
  };
  if (source !== undefined) task.source = source;
  if (isOverdue) {
    task.isOverdue = true;
    task.sublabel = 'from yesterday';
    task.datePill = 'urgent';
  }
  if (row.raw_input !== null) task.rawInput = row.raw_input;
  if (row.reasoning !== null) task.aiReason = row.reasoning;
  if (row.body !== null) task.notes = row.body;
  if (row.start_time !== null) task.startTime = row.start_time;
  return task;
}

function v2EventRowToEvent(row: V2EventRow): CalendarEvent {
  const source = sourceIdToView(row.source_id);
  const durationMins = Math.max(0, Math.round((Date.parse(row.ends_at) - Date.parse(row.starts_at)) / 60_000));
  const event: CalendarEvent = {
    id: row.item_id,
    date: localDateFromIso(row.starts_at),
    startTime: localTimeFromIso(row.starts_at),
    endTime: localTimeFromIso(row.ends_at),
    label: row.title,
    sublabel: row.reasoning ?? `${durationMins} min`,
  };
  if (row.body !== null) event.notes = row.body;
  if (source !== undefined) event.source = source;
  return event;
}

function nextSlotOrderForDate(database: Database.Database, date: string): number {
  const row = database
    .prepare(
      `SELECT COALESCE(MAX(slot_order), -100) + 100 AS slot_order
       FROM v2_item_plans
       WHERE plan_date = ? AND mode = 'float'`,
    )
    .get(date) as { slot_order: number };
  return row.slot_order;
}

function getEventOccurrence(id: string, conn?: Database.Database): V2EventRow | undefined {
  const row = dbOr(conn)
    .prepare(`${SELECT_V2_EVENTS} AND i.id = ? LIMIT 1`)
    .get(id) as V2EventRow | undefined;
  if (row === undefined) return undefined;
  const parsedReason = parseJson<{ reasoning?: string }>(row.reasoning);
  return { ...row, reasoning: parsedReason?.reasoning ?? null };
}

function getRelationSortOrders(parentItemId: string, conn?: Database.Database): Array<{ childItemId: string; sortOrder: number }> {
  return dbOr(conn)
    .prepare(
      `SELECT to_item_id AS childItemId, sort_order AS sortOrder
       FROM v2_item_relations
       WHERE from_item_id = ? AND relation_type = 'contains' AND archived_at IS NULL
       ORDER BY sort_order, created_at`,
    )
    .all(parentItemId) as Array<{ childItemId: string; sortOrder: number }>;
}

function rewriteRelationOrder(parentItemId: string, orderedChildIds: string[], conn?: Database.Database): void {
  const database = dbOr(conn);
  orderedChildIds.forEach((childId, index) => {
    database
      .prepare(
        `UPDATE v2_item_relations
         SET sort_order = ?
         WHERE from_item_id = ? AND to_item_id = ? AND relation_type = 'contains' AND archived_at IS NULL`,
      )
      .run(index * 100, parentItemId, childId);
  });
}

function ensureV2Defaults(database: Database.Database, now: string): void {
  database
    .prepare(
      `INSERT OR IGNORE INTO v2_workspaces
       (id, name, kind, created_by_actor_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(DEFAULT_WORKSPACE_ID, 'Personal workspace', 'personal', DEFAULT_ACTOR_ID, now, now);

  database
    .prepare(
      `INSERT OR IGNORE INTO v2_actors
       (id, workspace_id, kind, display_name, user_id, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(DEFAULT_ACTOR_ID, DEFAULT_WORKSPACE_ID, 'user', 'Ofer', 'user_ofer', '{}', now, now);

  database
    .prepare(
      `INSERT OR IGNORE INTO v2_sources
       (id, workspace_id, kind, label, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(DEFAULT_MANUAL_SOURCE_ID, DEFAULT_WORKSPACE_ID, 'manual', 'Manual capture', '{}', now, now);
}

function hasOwn<T extends object, K extends PropertyKey>(obj: T, key: K): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

const SELECT_V2_TASKS = `
  SELECT i.id AS item_id, i.title, i.body, i.status, i.bucket, i.source_id,
         p.plan_date, p.mode, p.start_time, p.slot_index, p.slot_order,
         ce.body AS raw_input, al.after_json AS reasoning
  FROM v2_items i
  LEFT JOIN v2_item_plans p ON p.item_id = i.id
  LEFT JOIN v2_capture_entries ce ON ce.promoted_item_id = i.id
  LEFT JOIN v2_activity_log al
    ON al.entity_type = 'item' AND al.entity_id = i.id AND al.action = 'ai_parse_accepted'
  WHERE i.kind = 'task'
    AND NOT EXISTS (
      SELECT 1 FROM v2_item_relations child_rel
      WHERE child_rel.to_item_id = i.id
        AND child_rel.relation_type = 'contains'
        AND child_rel.archived_at IS NULL
    )
`;

const SELECT_V2_EVENTS = `
  SELECT i.id AS item_id, i.title, i.body, i.source_id, o.starts_at, o.ends_at,
         al.after_json AS reasoning
  FROM v2_items i
  JOIN v2_item_occurrences o ON o.item_id = i.id
  LEFT JOIN v2_activity_log al
    ON al.entity_type = 'item' AND al.entity_id = i.id AND al.action = 'ai_parse_accepted'
  WHERE i.kind = 'event'
`;

const SELECT_V2_SUBTASKS = `
  SELECT r.from_item_id AS parent_item_id, i.id AS child_item_id, i.title, i.body, i.source_id, i.status, r.sort_order
  FROM v2_item_relations r
  JOIN v2_items i ON i.id = r.to_item_id
  WHERE r.relation_type = 'contains'
    AND r.archived_at IS NULL
    AND i.kind = 'task'
  ORDER BY r.sort_order, i.created_at
`;

function getV2SubtasksByParent(conn?: Database.Database): Map<string, Task['subtasks']> {
  const rows = dbOr(conn).prepare(SELECT_V2_SUBTASKS).all() as V2SubtaskRow[];
  const byParent = new Map<string, NonNullable<Task['subtasks']>>();
  for (const row of rows) {
    const subtasks = byParent.get(row.parent_item_id) ?? [];
    const source = sourceIdToView(row.source_id);
    const subtask: NonNullable<Task['subtasks']>[number] = {
      id: row.child_item_id,
      title: row.title,
      done: row.status === 'done',
      sortOrder: row.sort_order,
    };
    if (row.body !== null) subtask.notes = row.body;
    if (source !== undefined) subtask.source = source;
    subtasks.push(subtask);
    byParent.set(row.parent_item_id, subtasks);
  }
  return byParent;
}

function getV2Tasks(conn?: Database.Database): Task[] {
  const rows = dbOr(conn).prepare(`${SELECT_V2_TASKS} ORDER BY p.plan_date, p.slot_index, p.slot_order`).all() as V2TaskRow[];
  const subtasksByParent = getV2SubtasksByParent(conn);
  return rows.map((row) => {
    const parsedReason = parseJson<{ reasoning?: string }>(row.reasoning);
    const task = v2TaskRowToTask({ ...row, reasoning: parsedReason?.reasoning ?? null });
    const subtasks = subtasksByParent.get(task.id);
    if (subtasks !== undefined && subtasks.length > 0) task.subtasks = subtasks;
    return task;
  });
}

function getV2TaskById(id: string, conn?: Database.Database): Task | undefined {
  const row = dbOr(conn).prepare(`${SELECT_V2_TASKS} AND i.id = ? LIMIT 1`).get(id) as V2TaskRow | undefined;
  if (row === undefined) return undefined;
  const parsedReason = parseJson<{ reasoning?: string }>(row.reasoning);
  const task = v2TaskRowToTask({ ...row, reasoning: parsedReason?.reasoning ?? null });
  const subtasks = getV2SubtasksByParent(conn).get(task.id);
  if (subtasks !== undefined && subtasks.length > 0) task.subtasks = subtasks;
  return task;
}

function getV2Events(conn?: Database.Database): CalendarEvent[] {
  const rows = dbOr(conn).prepare(`${SELECT_V2_EVENTS} ORDER BY o.starts_at`).all() as V2EventRow[];
  return rows.map((row) => {
    const parsedReason = parseJson<{ reasoning?: string }>(row.reasoning);
    return v2EventRowToEvent({ ...row, reasoning: parsedReason?.reasoning ?? null });
  });
}

export function getAllTasks(conn?: Database.Database): Task[] {
  return getV2Tasks(conn);
}

export function updateTask(id: string, patch: Partial<Task>, conn?: Database.Database): Task {
  const database = dbOr(conn);
  const v2Existing = getV2TaskById(id, conn);
  if (v2Existing === undefined) {
    throw new Error(`Task not found: ${id}`);
  }

  const now = new Date().toISOString();
  if (patch.title !== undefined || patch.done !== undefined || patch.notes !== undefined || patch.bucket !== undefined) {
    database
      .prepare(
        `UPDATE v2_items SET
         title = COALESCE(?, title),
         body = COALESCE(?, body),
         status = COALESCE(?, status),
         bucket = COALESCE(?, bucket),
         updated_by_actor_id = ?,
         updated_at = ?
         WHERE id = ?`,
      )
      .run(
        patch.title ?? null,
        patch.notes ?? null,
        patch.done !== undefined ? (patch.done ? 'done' : 'open') : null,
        patch.bucket ?? null,
        DEFAULT_ACTOR_ID,
        now,
        id,
      );
  }

  if (
    patch.date !== undefined ||
    hasOwn(patch, 'date') ||
    patch.startTime !== undefined ||
    hasOwn(patch, 'startTime') ||
    patch.scheduleKind !== undefined ||
    patch.slotIndex !== undefined ||
    patch.slotOrder !== undefined
  ) {
    const nextMode =
      patch.scheduleKind !== undefined
        ? patch.scheduleKind === 'fixed'
          ? 'anchor'
          : 'float'
        : v2Existing.scheduleKind === 'fixed'
          ? 'anchor'
          : v2Existing.timeSlot === 'someday'
            ? 'stash'
            : 'float';
    const nextPlanDate = hasOwn(patch, 'date') ? patch.date : v2Existing.date;
    const nextStartTime = hasOwn(patch, 'startTime') ? patch.startTime : v2Existing.startTime;
    const nextSlotIndex = patch.slotIndex ?? v2Existing.slotIndex;
    const nextSlotOrder = patch.slotOrder ?? v2Existing.slotOrder;

    database
      .prepare(
        `UPDATE v2_item_plans SET
         plan_date = ?,
         mode = ?,
         start_time = ?,
         slot_index = ?,
         slot_order = ?,
         updated_at = ?
         WHERE item_id = ?`,
      )
      .run(
        nextPlanDate,
        nextMode,
        nextStartTime ?? null,
        nextSlotIndex,
        nextSlotOrder,
        now,
        id,
      );
  }

  const updated = getV2TaskById(id, conn);
  if (updated === undefined) {
    throw new Error(`Task not found after update: ${id}`);
  }
  return updated;
}

export function deleteTask(id: string, conn?: Database.Database): void {
  const database = dbOr(conn);
  const result = database.prepare('DELETE FROM v2_items WHERE id = ? AND kind = ?').run(id, 'task');
  if (result.changes === 0) {
    throw new Error(`Task not found: ${id}`);
  }
  database.prepare('DELETE FROM v2_item_plans WHERE item_id = ?').run(id);
  database.prepare('DELETE FROM v2_capture_entries WHERE promoted_item_id = ?').run(id);
}

export function addSubtask(parentItemId: string, title: string, conn?: Database.Database): Task {
  const database = dbOr(conn);
  const parent = getV2TaskById(parentItemId, conn);
  if (parent === undefined) {
    throw new Error(`Parent task not found: ${parentItemId}`);
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    throw new Error('Subtask title cannot be empty');
  }

  const now = new Date().toISOString();
  ensureV2Defaults(database, now);
  const childItemId = randomUUID();
  const relationId = randomUUID();
  const nextSortOrderRow = database
    .prepare(
      `SELECT COALESCE(MAX(sort_order), -100) + 100 AS sort_order
       FROM v2_item_relations
       WHERE from_item_id = ? AND relation_type = 'contains' AND archived_at IS NULL`,
    )
    .get(parentItemId) as { sort_order: number };

  database
    .prepare(
      `INSERT INTO v2_items
       (id, workspace_id, kind, bucket, title, body, status, visibility, commitment_level,
        source_id, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      childItemId,
      DEFAULT_WORKSPACE_ID,
      'task',
      'act',
      trimmedTitle,
      null,
      'open',
      'workspace',
      'soft',
      DEFAULT_MANUAL_SOURCE_ID,
      DEFAULT_ACTOR_ID,
      DEFAULT_ACTOR_ID,
      now,
      now,
    );

  database
    .prepare(
      `INSERT INTO v2_item_relations
       (id, workspace_id, from_item_id, to_item_id, relation_type, sort_order, created_by_actor_id, created_at, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      relationId,
      DEFAULT_WORKSPACE_ID,
      parentItemId,
      childItemId,
      'contains',
      nextSortOrderRow.sort_order,
      DEFAULT_ACTOR_ID,
      now,
      null,
    );

  database
    .prepare(
      `INSERT INTO v2_activity_log
       (id, workspace_id, actor_id, entity_type, entity_id, action, before_json, after_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      DEFAULT_WORKSPACE_ID,
      DEFAULT_ACTOR_ID,
      'item_relation',
      relationId,
      'subtask_added',
      null,
      JSON.stringify({ parentItemId, childItemId, title: trimmedTitle }),
      now,
    );

  const updated = getV2TaskById(parentItemId, conn);
  if (updated === undefined) throw new Error(`Parent task not found after subtask add: ${parentItemId}`);
  return updated;
}

export function toggleSubtask(parentItemId: string, subtaskId: string, conn?: Database.Database): Task {
  const database = dbOr(conn);
  const existing = database
    .prepare(
      `SELECT i.status
       FROM v2_item_relations r
       JOIN v2_items i ON i.id = r.to_item_id
       WHERE r.from_item_id = ? AND r.to_item_id = ? AND r.relation_type = 'contains' AND r.archived_at IS NULL`,
    )
    .get(parentItemId, subtaskId) as { status: string } | undefined;
  if (existing === undefined) {
    throw new Error(`Subtask not found: ${subtaskId}`);
  }

  const now = new Date().toISOString();
  const nextStatus = existing.status === 'done' ? 'open' : 'done';
  database
    .prepare('UPDATE v2_items SET status = ?, updated_by_actor_id = ?, updated_at = ? WHERE id = ?')
    .run(nextStatus, DEFAULT_ACTOR_ID, now, subtaskId);

  const updated = getV2TaskById(parentItemId, conn);
  if (updated === undefined) throw new Error(`Parent task not found after subtask toggle: ${parentItemId}`);
  return updated;
}

export function removeSubtask(parentItemId: string, subtaskId: string, conn?: Database.Database): Task {
  const database = dbOr(conn);
  const now = new Date().toISOString();
  const relationResult = database
    .prepare(
      `UPDATE v2_item_relations
       SET archived_at = ?
       WHERE from_item_id = ? AND to_item_id = ? AND relation_type = 'contains' AND archived_at IS NULL`,
    )
    .run(now, parentItemId, subtaskId);
  if (relationResult.changes === 0) {
    throw new Error(`Subtask not found: ${subtaskId}`);
  }

  database.prepare('DELETE FROM v2_items WHERE id = ? AND kind = ?').run(subtaskId, 'task');

  const updated = getV2TaskById(parentItemId, conn);
  if (updated === undefined) throw new Error(`Parent task not found after subtask remove: ${parentItemId}`);
  return updated;
}

export function updateSubtask(
  parentItemId: string,
  subtaskId: string,
  patch: { title?: string; notes?: string },
  conn?: Database.Database,
): Task {
  const database = dbOr(conn);
  const now = new Date().toISOString();
  const relation = database
    .prepare(
      `SELECT 1
       FROM v2_item_relations
       WHERE from_item_id = ? AND to_item_id = ? AND relation_type = 'contains' AND archived_at IS NULL`,
    )
    .get(parentItemId, subtaskId);
  if (relation === undefined) {
    throw new Error(`Subtask not found: ${subtaskId}`);
  }

  database
    .prepare(
      `UPDATE v2_items SET
       title = COALESCE(?, title),
       body = COALESCE(?, body),
       updated_by_actor_id = ?,
       updated_at = ?
       WHERE id = ?`,
    )
    .run(
      patch.title?.trim().length ? patch.title.trim() : null,
      patch.notes ?? null,
      DEFAULT_ACTOR_ID,
      now,
      subtaskId,
    );

  const updated = getV2TaskById(parentItemId, conn);
  if (updated === undefined) throw new Error(`Parent task not found after subtask update: ${parentItemId}`);
  return updated;
}

export function reorderSubtask(
  parentItemId: string,
  subtaskId: string,
  toIndex: number,
  conn?: Database.Database,
): void {
  const relationOrder = getRelationSortOrders(parentItemId, conn);
  const currentIndex = relationOrder.findIndex((item) => item.childItemId === subtaskId);
  if (currentIndex === -1) {
    throw new Error(`Subtask not found: ${subtaskId}`);
  }

  const orderedChildIds = relationOrder.map((item) => item.childItemId);
  const [moved] = orderedChildIds.splice(currentIndex, 1);
  if (moved === undefined) {
    throw new Error(`Subtask not found: ${subtaskId}`);
  }
  const boundedIndex = Math.max(0, Math.min(toIndex, orderedChildIds.length));
  orderedChildIds.splice(boundedIndex, 0, moved);
  rewriteRelationOrder(parentItemId, orderedChildIds, conn);
}

export function moveSubtask(
  parentItemId: string,
  subtaskId: string,
  targetTaskId: string,
  conn?: Database.Database,
): void {
  if (parentItemId === targetTaskId) return;

  const database = dbOr(conn);
  const target = getV2TaskById(targetTaskId, conn);
  if (target === undefined) {
    throw new Error(`Target task not found: ${targetTaskId}`);
  }

  const nextSortOrder = getRelationSortOrders(targetTaskId, conn).length * 100;
  const result = database
    .prepare(
      `UPDATE v2_item_relations
       SET from_item_id = ?, sort_order = ?
       WHERE from_item_id = ? AND to_item_id = ? AND relation_type = 'contains' AND archived_at IS NULL`,
    )
    .run(targetTaskId, nextSortOrder, parentItemId, subtaskId);
  if (result.changes === 0) {
    throw new Error(`Subtask not found: ${subtaskId}`);
  }

  rewriteRelationOrder(parentItemId, getRelationSortOrders(parentItemId, conn).map((item) => item.childItemId), conn);
}

export function promoteSubtask(parentItemId: string, subtaskId: string, conn?: Database.Database): void {
  const database = dbOr(conn);
  const parent = getV2TaskById(parentItemId, conn);
  if (parent === undefined) {
    throw new Error(`Parent task not found: ${parentItemId}`);
  }

  const now = new Date().toISOString();
  const relationResult = database
    .prepare(
      `UPDATE v2_item_relations
       SET archived_at = ?
       WHERE from_item_id = ? AND to_item_id = ? AND relation_type = 'contains' AND archived_at IS NULL`,
    )
    .run(now, parentItemId, subtaskId);
  if (relationResult.changes === 0) {
    throw new Error(`Subtask not found: ${subtaskId}`);
  }

  database
    .prepare(
      `INSERT OR REPLACE INTO v2_item_plans
       (id, workspace_id, item_id, actor_id, plan_date, mode, start_time, end_time,
        slot_index, slot_order, timezone, relative_to_occurrence_id, relative_offset_minutes,
        created_at, updated_at)
       VALUES (
         COALESCE((SELECT id FROM v2_item_plans WHERE item_id = ?), ?),
         ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL, NULL,
         COALESCE((SELECT created_at FROM v2_item_plans WHERE item_id = ?), ?), ?
       )`,
    )
    .run(
      subtaskId,
      randomUUID(),
      DEFAULT_WORKSPACE_ID,
      DEFAULT_ACTOR_ID,
      subtaskId,
      parent.date,
      parent.date === null ? 'stash' : 'float',
      parent.slotIndex,
      parent.slotOrder + 100,
      DEFAULT_TIMEZONE,
      subtaskId,
      now,
      now,
    );

  rewriteRelationOrder(parentItemId, getRelationSortOrders(parentItemId, conn).map((item) => item.childItemId), conn);
}

export function nestTask(taskId: string, targetTaskId: string, conn?: Database.Database): void {
  if (taskId === targetTaskId) {
    throw new Error('A task cannot become its own subtask');
  }

  const database = dbOr(conn);
  const task = getV2TaskById(taskId, conn);
  const target = getV2TaskById(targetTaskId, conn);
  if (task === undefined) throw new Error(`Task not found: ${taskId}`);
  if (target === undefined) throw new Error(`Target task not found: ${targetTaskId}`);

  const now = new Date().toISOString();
  ensureV2Defaults(database, now);
  const sortOrder = getRelationSortOrders(targetTaskId, conn).length * 100;

  database
    .prepare(
      `INSERT INTO v2_item_relations
       (id, workspace_id, from_item_id, to_item_id, relation_type, sort_order, created_by_actor_id, created_at, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(randomUUID(), DEFAULT_WORKSPACE_ID, targetTaskId, taskId, 'contains', sortOrder, DEFAULT_ACTOR_ID, now, null);

  database.prepare('DELETE FROM v2_item_plans WHERE item_id = ?').run(taskId);
}

export function getAllEvents(conn?: Database.Database): CalendarEvent[] {
  return getV2Events(conn);
}

export function updateEvent(id: string, patch: Partial<CalendarEvent>, conn?: Database.Database): CalendarEvent {
  const database = dbOr(conn);
  const existing = getEventOccurrence(id, conn);
  if (existing === undefined) {
    throw new Error(`Event not found: ${id}`);
  }

  const now = new Date().toISOString();
  if (patch.label !== undefined || patch.notes !== undefined) {
    database
      .prepare(
        `UPDATE v2_items SET
         title = COALESCE(?, title),
         body = COALESCE(?, body),
         updated_by_actor_id = ?,
         updated_at = ?
         WHERE id = ?`,
      )
      .run(
        patch.label?.trim().length ? patch.label.trim() : null,
        patch.notes ?? null,
        DEFAULT_ACTOR_ID,
        now,
        id,
      );
  }

  if (
    patch.date !== undefined ||
    patch.startTime !== undefined ||
    patch.endTime !== undefined
  ) {
    const nextDate = patch.date ?? localDateFromIso(existing.starts_at);
    const nextStartTime = patch.startTime ?? localTimeFromIso(existing.starts_at);
    const nextEndTime = patch.endTime ?? localTimeFromIso(existing.ends_at);
    database
      .prepare(
        `UPDATE v2_item_occurrences SET
         starts_at = ?,
         ends_at = ?,
         updated_at = ?
         WHERE item_id = ?`,
      )
      .run(
        isoDateTimeForLocal(nextDate, nextStartTime),
        isoDateTimeForLocal(nextDate, nextEndTime),
        now,
        id,
      );
  }

  const updated = getEventOccurrence(id, conn);
  if (updated === undefined) {
    throw new Error(`Event not found after update: ${id}`);
  }
  return v2EventRowToEvent(updated);
}

export function deleteEvent(id: string, conn?: Database.Database): void {
  const database = dbOr(conn);
  database.prepare('DELETE FROM v2_item_occurrences WHERE item_id = ?').run(id);
  const result = database.prepare('DELETE FROM v2_items WHERE id = ? AND kind = ?').run(id, 'event');
  if (result.changes === 0) {
    throw new Error(`Event not found: ${id}`);
  }
}

export function convertEventToTask(id: string, conn?: Database.Database): void {
  const database = dbOr(conn);
  const existing = getEventOccurrence(id, conn);
  if (existing === undefined) {
    throw new Error(`Event not found: ${id}`);
  }

  const eventDate = localDateFromIso(existing.starts_at);
  const now = new Date().toISOString();
  database.prepare('DELETE FROM v2_item_occurrences WHERE item_id = ?').run(id);
  database
    .prepare(
      `UPDATE v2_items SET
       kind = 'task',
       commitment_level = 'soft',
       updated_by_actor_id = ?,
       updated_at = ?
       WHERE id = ?`,
    )
    .run(DEFAULT_ACTOR_ID, now, id);

  database
    .prepare(
      `INSERT INTO v2_item_plans
       (id, workspace_id, item_id, actor_id, plan_date, mode, start_time, end_time,
        slot_index, slot_order, timezone, relative_to_occurrence_id, relative_offset_minutes,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL, NULL, ?, ?)`,
    )
    .run(
      randomUUID(),
      DEFAULT_WORKSPACE_ID,
      id,
      DEFAULT_ACTOR_ID,
      eventDate,
      'float',
      0,
      nextSlotOrderForDate(database, eventDate),
      DEFAULT_TIMEZONE,
      now,
      now,
    );
}

function writeAcceptedParseActivity(
  database: Database.Database,
  itemId: string,
  parsedItem: ParsedPlanningItem,
  now: string,
): void {
  database
    .prepare(
      `INSERT INTO v2_activity_log
       (id, workspace_id, actor_id, entity_type, entity_id, action, before_json, after_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      DEFAULT_WORKSPACE_ID,
      DEFAULT_ACTOR_ID,
      'item',
      itemId,
      'ai_parse_accepted',
      null,
      JSON.stringify({
        reasoning: parsedItem.reasoning,
        confidence: parsedItem.confidence,
        itemType: parsedItem.itemType,
        scheduleMode: parsedItem.scheduleMode,
      }),
      now,
    );
}

export function createPlanningItemsFromCapture(
  input: { rawInput: string; items: ParsedPlanningItem[] },
  conn?: Database.Database,
): { tasks: Task[]; events: CalendarEvent[] } {
  const database = dbOr(conn);
  const now = new Date().toISOString();
  ensureV2Defaults(database, now);

  const createAll = database.transaction(() => {
    const createdTasks: Task[] = [];
    const createdEvents: CalendarEvent[] = [];

    input.items.forEach((parsedItem, index) => {
      const title = parsedItem.title.trim();
      if (!title) return;

      const itemId = randomUUID();
      const captureId = randomUUID();
      const itemKind = parsedItem.itemType;
      const sourceId = DEFAULT_MANUAL_SOURCE_ID;

      database
        .prepare(
          `INSERT INTO v2_items
           (id, workspace_id, kind, bucket, title, body, status, visibility, commitment_level,
            source_id, created_by_actor_id, updated_by_actor_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          itemId,
          DEFAULT_WORKSPACE_ID,
          itemKind,
          'act',
          title,
          null,
          'open',
          'workspace',
          parsedItem.scheduleMode === 'fixed' || itemKind === 'event' ? 'firm' : 'soft',
          sourceId,
          DEFAULT_ACTOR_ID,
          DEFAULT_ACTOR_ID,
          now,
          now,
        );

      database
        .prepare(
          `INSERT INTO v2_capture_entries
           (id, workspace_id, actor_id, body, status, promoted_item_id, captured_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(captureId, DEFAULT_WORKSPACE_ID, DEFAULT_ACTOR_ID, input.rawInput, 'promoted', itemId, now, now, now);

      writeAcceptedParseActivity(database, itemId, parsedItem, now);

      if (itemKind === 'event') {
        const eventDate = parsedItem.suggestedDate ?? dateForBucket(parsedItem.bucket) ?? toISODate();
        const startTime = parsedItem.suggestedTime ?? '09:00';
        const startsAt = isoDateTimeForLocal(eventDate, startTime);
        const endsAt = new Date(Date.parse(startsAt) + 30 * 60_000).toISOString();
        database
          .prepare(
            `INSERT INTO v2_item_occurrences
             (id, workspace_id, item_id, starts_at, ends_at, timezone, status, source_id,
              external_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(randomUUID(), DEFAULT_WORKSPACE_ID, itemId, startsAt, endsAt, DEFAULT_TIMEZONE, 'confirmed', sourceId, null, now, now);

        createdEvents.push(
          v2EventRowToEvent({
            item_id: itemId,
            title,
            body: null,
            source_id: sourceId,
            starts_at: startsAt,
            ends_at: endsAt,
            reasoning: parsedItem.reasoning,
          }),
        );
        return;
      }

      const planDate = parsedItem.suggestedDate ?? dateForBucket(parsedItem.bucket);
      const mode = parsedItem.bucket === 'someday' ? 'stash' : parsedItem.scheduleMode === 'fixed' ? 'anchor' : 'float';
      database
        .prepare(
          `INSERT INTO v2_item_plans
           (id, workspace_id, item_id, actor_id, plan_date, mode, start_time, end_time,
            slot_index, slot_order, timezone, relative_to_occurrence_id, relative_offset_minutes,
            created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          randomUUID(),
          DEFAULT_WORKSPACE_ID,
          itemId,
          DEFAULT_ACTOR_ID,
          planDate,
          mode,
          parsedItem.scheduleMode === 'fixed' ? parsedItem.suggestedTime ?? null : null,
          null,
          mode === 'float' ? 0 : null,
          mode === 'float' ? index * 100 : null,
          DEFAULT_TIMEZONE,
          null,
          null,
          now,
          now,
        );

      createdTasks.push(
        v2TaskRowToTask({
          item_id: itemId,
          title,
          body: null,
          status: 'open',
          bucket: 'act',
          source_id: sourceId,
          plan_date: planDate,
          mode,
          start_time: parsedItem.scheduleMode === 'fixed' ? parsedItem.suggestedTime ?? null : null,
          slot_index: mode === 'float' ? 0 : null,
          slot_order: mode === 'float' ? index * 100 : null,
          raw_input: input.rawInput,
          reasoning: parsedItem.reasoning,
        }),
      );
    });

    return { tasks: createdTasks, events: createdEvents };
  });

  return createAll();
}

export function createCaptureEntry(
  entry: { body: string },
  conn?: Database.Database,
): CaptureEntry {
  const database = dbOr(conn);
  const now = new Date().toISOString();
  ensureV2Defaults(database, now);
  const capture: CaptureEntry = {
    id: randomUUID(),
    body: entry.body,
    createdAt: now,
  };

  database
    .prepare(
      `INSERT INTO v2_capture_entries
       (id, workspace_id, actor_id, body, status, promoted_item_id, captured_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(capture.id, DEFAULT_WORKSPACE_ID, DEFAULT_ACTOR_ID, capture.body, 'raw', null, now, now, now);

  return capture;
}

export function getRecentCaptureEntries(limit = 50, conn?: Database.Database): CaptureEntry[] {
  const rows = dbOr(conn)
    .prepare(
      `SELECT id, body, captured_at FROM v2_capture_entries
       ORDER BY captured_at DESC LIMIT ?`,
    )
    .all(limit) as CaptureEntryRow[];

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.captured_at,
  }));
}

export function countTasks(conn?: Database.Database): number {
  const row = dbOr(conn)
    .prepare("SELECT COUNT(*) AS count FROM v2_items WHERE kind = 'task'")
    .get() as { count: number };
  return row.count;
}

export function countV2Items(conn?: Database.Database): number {
  const row = dbOr(conn).prepare('SELECT COUNT(*) AS count FROM v2_items').get() as { count: number };
  return row.count;
}
