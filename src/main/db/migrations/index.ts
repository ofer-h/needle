import type Database from 'better-sqlite3';
import { migrationId as initialSchemaId, up as upInitialSchema } from './001_initial_schema';

type Migration = {
  id: string;
  up: (db: Database.Database) => void;
};

const MIGRATIONS: Migration[] = [
  { id: initialSchemaId, up: upInitialSchema },
];

export function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db
      .prepare('SELECT id FROM schema_migrations')
      .all()
      .map((row) => (row as { id: string }).id),
  );

  const insertMigration = db.prepare(
    'INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)',
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue;
    migration.up(db);
    insertMigration.run(migration.id, new Date().toISOString());
  }
}
