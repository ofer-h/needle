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

describe('repository', () => {
  afterEach(() => {
    close();
  });

  it('round-trips task CRUD', () => {
    const conn = openMemoryDb();

    const created = repo.createTask(
      {
        title: 'Test task',
        kind: 'upcoming',
        date: '2026-05-27',
        done: false,
        bucket: 'act',
        timeSlot: 'today',
        scheduleKind: 'flexible',
        slotIndex: 0,
        slotOrder: 0,
      },
      conn,
    );

    expect(created.id).toBeTruthy();
    expect(repo.getAllTasks(conn)).toHaveLength(1);

    const updated = repo.updateTask(created.id, { done: true }, conn);
    expect(updated.done).toBe(true);

    repo.deleteTask(created.id, conn);
    expect(repo.getAllTasks(conn)).toHaveLength(0);
    conn.close();
  });

  it('round-trips calendar events', () => {
    const conn = openMemoryDb();

    const event = repo.createEvent(
      {
        label: 'Standup',
        date: '2026-05-27',
        startTime: '09:00',
        endTime: '09:15',
      },
      conn,
    );

    expect(repo.getAllEvents(conn)).toEqual([event]);
    expect(repo.getEventsByDate('2026-05-27', conn)).toEqual([event]);
    conn.close();
  });

  it('persists rows across database reopen on disk', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'needle-db-test-'));
    const dbPath = path.join(dir, 'needle.db');

    const first = new Database(dbPath);
    migrate(first);
    repo.createTask(
      {
        id: 'persist-task',
        title: 'Persist me',
        kind: 'faded',
        date: null,
        done: false,
        bucket: 'act',
        timeSlot: 'someday',
        scheduleKind: 'flexible',
        slotIndex: 0,
        slotOrder: 0,
      },
      first,
    );
    first.close();

    const second = new Database(dbPath);
    migrate(second);
    const tasks = repo.getAllTasks(second);
    expect(tasks.some((t) => t.id === 'persist-task' && t.title === 'Persist me')).toBe(true);
    second.close();

    fs.rmSync(dir, { recursive: true, force: true });
  });
});
