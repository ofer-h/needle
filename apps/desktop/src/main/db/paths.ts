import path from 'node:path';

/** Ensures resolvedPath stays inside resolvedRoot (userData). */
export function assertPathUnderRoot(resolvedRoot: string, resolvedPath: string): void {
  const root = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(root)) {
    throw new Error('Database path must be under userData');
  }
}

export function resolveDbPath(userDataDir: string): string {
  const resolvedRoot = path.resolve(userDataDir);
  const dbPath = path.resolve(resolvedRoot, 'needle.db');
  assertPathUnderRoot(resolvedRoot, dbPath);
  return dbPath;
}
