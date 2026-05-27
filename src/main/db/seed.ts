import type Database from 'better-sqlite3';
import { buildSeedTasksAndEvents } from './seed-data';
import * as repo from './repository';

export function seedIfEmpty(conn: Database.Database): void {
  if (repo.countTasks(conn) > 0) return;

  const { tasks, events } = buildSeedTasksAndEvents();
  for (const task of tasks) {
    repo.createTask(task, conn);
  }
  for (const event of events) {
    repo.createEvent(event, conn);
  }
}
