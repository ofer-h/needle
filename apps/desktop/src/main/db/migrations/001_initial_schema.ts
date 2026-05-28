import type Database from 'better-sqlite3';

export const migrationId = '001_initial_schema';

export function up(_db: Database.Database): void {
  // Kept only so databases that already recorded this migration keep a stable
  // migration history. Live schema begins at 002_v2_planning_schema.
}
