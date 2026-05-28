import Database from 'better-sqlite3';
import { app } from 'electron';
import { migrate } from './migrations';
import { resolveDbPath } from './paths';

let db: Database.Database | null = null;

export function open(dbPath?: string): Database.Database {
  if (db) return db;

  const path = dbPath ?? resolveDbPath(app.getPath('userData'));
  db = new Database(path);
  migrate(db);
  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not opened. Call open() during app bootstrap.');
  }
  return db;
}

export function close(): void {
  if (db) {
    db.close();
    db = null;
  }
}
