import type Database from 'better-sqlite3';

export const migrationId = '003_drop_legacy_tables';

export function up(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS calendar_events;
    DROP TABLE IF EXISTS capture_entries;
  `);
}
