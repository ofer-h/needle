import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertPathUnderRoot, resolveDbPath } from '../paths';

describe('paths', () => {
  it('resolves needle.db under userData', () => {
    const userData = path.resolve('/tmp/needle-user-data');
    const dbPath = resolveDbPath(userData);
    expect(dbPath).toBe(path.join(userData, 'needle.db'));
  });

  it('rejects paths outside userData', () => {
    const root = path.resolve('/tmp/needle-user-data');
    const outside = path.resolve('/tmp/evil.db');
    expect(() => assertPathUnderRoot(root, outside)).toThrow(/userData/);
  });
});
