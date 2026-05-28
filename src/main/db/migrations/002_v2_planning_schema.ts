import type Database from 'better-sqlite3';

export const migrationId = '002_v2_planning_schema';

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS v2_workspaces (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      created_by_actor_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS v2_actors (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      display_name TEXT NOT NULL,
      user_id TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS v2_sources (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      label TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS v2_items (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      bucket TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      status TEXT NOT NULL,
      visibility TEXT NOT NULL,
      commitment_level TEXT NOT NULL,
      source_id TEXT,
      created_by_actor_id TEXT NOT NULL,
      updated_by_actor_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_v2_items_workspace_kind ON v2_items(workspace_id, kind);

    CREATE TABLE IF NOT EXISTS v2_item_relations (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      from_item_id TEXT NOT NULL,
      to_item_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      sort_order REAL NOT NULL,
      created_by_actor_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_v2_item_relations_from ON v2_item_relations(from_item_id, relation_type);
    CREATE INDEX IF NOT EXISTS idx_v2_item_relations_to ON v2_item_relations(to_item_id, relation_type);

    CREATE TABLE IF NOT EXISTS v2_item_plans (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      plan_date TEXT,
      mode TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      slot_index INTEGER,
      slot_order REAL,
      timezone TEXT NOT NULL,
      relative_to_occurrence_id TEXT,
      relative_offset_minutes INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_v2_item_plans_actor_date ON v2_item_plans(actor_id, plan_date);
    CREATE INDEX IF NOT EXISTS idx_v2_item_plans_item ON v2_item_plans(item_id);

    CREATE TABLE IF NOT EXISTS v2_item_occurrences (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      timezone TEXT NOT NULL,
      status TEXT NOT NULL,
      source_id TEXT,
      external_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_v2_item_occurrences_start ON v2_item_occurrences(starts_at);

    CREATE TABLE IF NOT EXISTS v2_activity_log (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      before_json TEXT,
      after_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS v2_capture_entries (
      id TEXT PRIMARY KEY NOT NULL,
      workspace_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      promoted_item_id TEXT,
      captured_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}
