import type Database from 'better-sqlite3';

export const migrationId = '004_tags';

export function up(db: Database.Database): void {
  db.exec(`
    -- Tags: lightweight labels with a color and optional automation config
    CREATE TABLE IF NOT EXISTS v2_tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      automation TEXT
    );

    -- Item tags: join between items and tags
    CREATE TABLE IF NOT EXISTS v2_item_tags (
      item_id TEXT NOT NULL,
      tag_id TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_v2_item_tags_item ON v2_item_tags(item_id);
    CREATE INDEX IF NOT EXISTS idx_v2_item_tags_tag ON v2_item_tags(tag_id);
  `);
}
