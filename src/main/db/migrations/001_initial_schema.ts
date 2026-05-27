import type Database from 'better-sqlite3';

export const migrationId = '001_initial_schema';

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      date TEXT,
      date_label TEXT,
      time_slot TEXT NOT NULL,
      bucket TEXT NOT NULL,
      kind TEXT NOT NULL,
      start_time TEXT,
      slot_index INTEGER NOT NULL,
      slot_order INTEGER NOT NULL,
      is_overdue INTEGER NOT NULL DEFAULT 0,
      is_complete INTEGER NOT NULL DEFAULT 0,
      subtasks TEXT,
      source TEXT,
      lead_time_mins INTEGER,
      schedule_kind TEXT NOT NULL,
      sublabel TEXT,
      link TEXT,
      date_pill TEXT,
      raw_input TEXT,
      ai_reason TEXT,
      relations TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      sublabel TEXT,
      source TEXT,
      relations TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);

    CREATE TABLE IF NOT EXISTS capture_entries (
      id TEXT PRIMARY KEY NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
