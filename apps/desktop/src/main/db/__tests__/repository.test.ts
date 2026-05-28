import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { close } from '../index';
import { migrate } from '../migrations';
import * as repo from '../repository';

function openMemoryDb(): Database.Database {
  const conn = new Database(':memory:');
  migrate(conn);
  return conn;
}

function createPlanningTask(conn: Database.Database, title: string, date: string | null = '2026-05-27') {
  const result = repo.createPlanningItemsFromCapture(
    {
      rawInput: title,
      items: [
        {
          id: `test-${title.toLowerCase().replaceAll(/\s+/g, '-')}`,
          itemType: 'task',
          scheduleMode: 'flexible',
          title,
          bucket: date === null ? 'someday' : 'today',
          ...(date !== null ? { suggestedDate: date } : {}),
          reasoning: 'Test task.',
          confidence: 1,
        },
      ],
    },
    conn,
  );
  const task = result.tasks[0];
  if (task === undefined) throw new Error('Expected task to be created');
  return task;
}

function createPlanningEvent(conn: Database.Database, title: string, date = '2026-05-27', time = '09:00') {
  const result = repo.createPlanningItemsFromCapture(
    {
      rawInput: title,
      items: [
        {
          id: `test-${title.toLowerCase().replaceAll(/\s+/g, '-')}`,
          itemType: 'event',
          scheduleMode: 'fixed',
          title,
          bucket: 'today',
          suggestedDate: date,
          suggestedTime: time,
          reasoning: 'Test event.',
          confidence: 1,
        },
      ],
    },
    conn,
  );
  const event = result.events[0];
  if (event === undefined) throw new Error('Expected event to be created');
  return event;
}

describe('repository', () => {
  afterEach(() => {
    close();
  });

  it('round-trips task CRUD', () => {
    const conn = openMemoryDb();

    const created = createPlanningTask(conn, 'Test task');

    expect(created.id).toBeTruthy();
    expect(repo.getAllTasks(conn)).toHaveLength(1);

    const updated = repo.updateTask(created.id, { done: true }, conn);
    expect(updated.done).toBe(true);

    repo.deleteTask(created.id, conn);
    expect(repo.getAllTasks(conn)).toHaveLength(0);
    conn.close();
  });

  it('persists subtasks as child v2 items and contains relations', () => {
    const conn = openMemoryDb();

    const created = createPlanningTask(conn, 'Parent task');

    const withSubtask = repo.addSubtask(created.id, 'Child task', conn);
    expect(withSubtask.subtasks).toEqual([{ id: expect.any(String), title: 'Child task', done: false }]);

    const subtaskId = withSubtask.subtasks![0]!.id;
    const toggled = repo.toggleSubtask(created.id, subtaskId, conn);
    expect(toggled.subtasks?.[0]?.done).toBe(true);

    const relationCount = conn
      .prepare("SELECT COUNT(*) AS count FROM v2_item_relations WHERE relation_type = 'contains'")
      .get() as { count: number };
    expect(relationCount.count).toBe(1);

    const removed = repo.removeSubtask(created.id, subtaskId, conn);
    expect(removed.subtasks).toBeUndefined();

    conn.close();
  });

  it('supports editing, reordering, moving, and promoting child items', () => {
    const conn = openMemoryDb();

    const parentA = createPlanningTask(conn, 'Parent A');
    const parentB = createPlanningTask(conn, 'Parent B');
    const standalone = createPlanningTask(conn, 'Standalone task');

    repo.addSubtask(parentA.id, 'First child', conn);
    const withSecond = repo.addSubtask(parentA.id, 'Second child', conn);
    const firstChildId = withSecond.subtasks?.[0]?.id;
    const secondChildId = withSecond.subtasks?.[1]?.id;
    if (!firstChildId || !secondChildId) throw new Error('Expected child tasks');

    const updated = repo.updateSubtask(parentA.id, firstChildId, { title: 'Edited child', notes: 'Context' }, conn);
    expect(updated.subtasks?.[0]).toMatchObject({ title: 'Edited child', notes: 'Context' });

    repo.reorderSubtask(parentA.id, secondChildId, 0, conn);
    expect(repo.getAllTasks(conn).find((task) => task.id === parentA.id)?.subtasks?.[0]?.id).toBe(secondChildId);

    repo.moveSubtask(parentA.id, firstChildId, parentB.id, conn);
    expect(repo.getAllTasks(conn).find((task) => task.id === parentB.id)?.subtasks?.[0]?.id).toBe(firstChildId);

    repo.promoteSubtask(parentB.id, firstChildId, conn);
    expect(repo.getAllTasks(conn).some((task) => task.id === firstChildId)).toBe(true);

    repo.nestTask(standalone.id, parentA.id, conn);
    expect(repo.getAllTasks(conn).find((task) => task.id === parentA.id)?.subtasks?.some((subtask) => subtask.id === standalone.id)).toBe(true);

    conn.close();
  });

  it('round-trips calendar events', () => {
    const conn = openMemoryDb();

    const event = createPlanningEvent(conn, 'Standup');

    expect(repo.getAllEvents(conn)).toEqual([event]);
    conn.close();
  });

  it('lets users edit event fields or remove time into a task', () => {
    const conn = openMemoryDb();

    const event = createPlanningEvent(conn, 'Planning sync');
    const updated = repo.updateEvent(
      event.id,
      {
        label: 'Planning sync updated',
        date: '2026-05-28',
        startTime: '14:00',
        endTime: '15:00',
        notes: 'Editable notes',
      },
      conn,
    );

    expect(updated).toMatchObject({
      label: 'Planning sync updated',
      date: '2026-05-28',
      startTime: '14:00',
      endTime: '15:00',
      notes: 'Editable notes',
    });

    repo.convertEventToTask(event.id, conn);
    expect(repo.getAllEvents(conn)).toHaveLength(0);
    expect(repo.getAllTasks(conn).some((task) => task.id === event.id && task.date === '2026-05-28')).toBe(true);

    conn.close();
  });

  it('persists rows across database reopen on disk', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'needle-db-test-'));
    const dbPath = path.join(dir, 'needle.db');

    const first = new Database(dbPath);
    migrate(first);
    const created = createPlanningTask(first, 'Persist me', null);
    first.close();

    const second = new Database(dbPath);
    migrate(second);
    const tasks = repo.getAllTasks(second);
    expect(tasks.some((t) => t.id === created.id && t.title === 'Persist me')).toBe(true);
    second.close();

    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('creates AI planning blocks as v2 items and projects them to Today rows', () => {
    const conn = openMemoryDb();

    const created = repo.createPlanningItemsFromCapture(
      {
        rawInput: 'Tomorrow call Dan and schedule dentist appointment at 13:00',
        items: [
          {
            id: 'parsed-call-dan',
            itemType: 'task',
            scheduleMode: 'flexible',
            title: 'Call Dan',
            bucket: 'tomorrow',
            reasoning: 'The user explicitly asked to do this tomorrow.',
            confidence: 0.93,
          },
          {
            id: 'parsed-dentist',
            itemType: 'event',
            scheduleMode: 'fixed',
            title: 'Dentist appointment',
            bucket: 'tomorrow',
            suggestedTime: '13:00',
            reasoning: 'This has a strict appointment time.',
            confidence: 0.91,
          },
        ],
      },
      conn,
    );

    expect(created.tasks).toHaveLength(1);
    expect(created.events).toHaveLength(1);
    expect(created.tasks[0]?.title).toBe('Call Dan');
    expect(created.events[0]?.label).toBe('Dentist appointment');

    const v2ItemCount = conn.prepare('SELECT COUNT(*) AS count FROM v2_items').get() as { count: number };
    const v2PlanCount = conn.prepare('SELECT COUNT(*) AS count FROM v2_item_plans').get() as { count: number };
    const v2OccurrenceCount = conn.prepare('SELECT COUNT(*) AS count FROM v2_item_occurrences').get() as { count: number };

    expect(v2ItemCount.count).toBe(2);
    expect(v2PlanCount.count).toBe(1);
    expect(v2OccurrenceCount.count).toBe(1);
    expect(repo.getAllTasks(conn).some((task) => task.title === 'Call Dan')).toBe(true);
    expect(repo.getAllEvents(conn).some((event) => event.label === 'Dentist appointment')).toBe(true);

    const taskId = created.tasks[0]!.id;
    const updated = repo.updateTask(taskId, { done: true }, conn);
    expect(updated.done).toBe(true);
    expect(repo.getAllTasks(conn).find((task) => task.id === taskId)?.done).toBe(true);

    const moved = repo.updateTask(taskId, { date: null, slotIndex: 2, slotOrder: 50 }, conn);
    expect(moved.date).toBeNull();
    expect(moved.slotIndex).toBe(2);
    expect(moved.slotOrder).toBe(50);

    conn.close();
  });
});
