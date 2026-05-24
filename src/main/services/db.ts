import { DatabaseSync } from 'node:sqlite';
import { app } from 'electron';
import path from 'node:path';

let db: DatabaseSync | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  bucket TEXT NOT NULL CHECK (bucket IN ('act', 'remember')),
  time_slot TEXT NOT NULL CHECK (time_slot IN ('today', 'tomorrow', 'in-a-few-days', 'next-week', 'someday')),
  kind TEXT NOT NULL CHECK (kind IN ('urgent', 'upcoming', 'faded')),
  done INTEGER NOT NULL DEFAULT 0,
  sublabel TEXT,
  link TEXT,
  date_pill TEXT CHECK (date_pill IN ('urgent', 'upcoming')),
  ai_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export function initDb(): DatabaseSync {
  if (db) return db;

  const dbPath = path.join(app.getPath('userData'), 'focus.db');
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}

export function getDb(): DatabaseSync {
  if (!db) throw new Error('Database not initialized');
  return db;
}
