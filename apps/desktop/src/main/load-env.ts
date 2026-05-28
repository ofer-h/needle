import { existsSync } from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';
import { app } from 'electron';
import { needleLog } from './log';

export type EnvLoadResult = {
  loaded: boolean;
  path: string | null;
};

let envLoadResult: EnvLoadResult = { loaded: false, path: null };

/**
 * Walk up from `start` looking for the monorepo root (the dir holding
 * `pnpm-workspace.yaml`). Returns null if not found within a few levels.
 */
function findMonorepoRoot(start: string): string | null {
  let dir = start;
  for (let i = 0; i < 10; i++) {
    if (existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Load the monorepo-root `.env` for local development only.
 *
 * The app now lives in `apps/desktop`, so the dev `.env` is at the monorepo
 * root. Prefer the dir holding `pnpm-workspace.yaml`; fall back to walking up
 * from the compiled bundle and cwd.
 */
export function loadLocalEnv(): EnvLoadResult {
  if (app.isPackaged) {
    envLoadResult = { loaded: false, path: null };
    return envLoadResult;
  }

  const repoRoot =
    findMonorepoRoot(__dirname) ?? findMonorepoRoot(process.cwd());
  const candidates = [
    repoRoot ? path.join(repoRoot, '.env') : null,
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../../../.env'),
    path.join(process.cwd(), '.env'),
  ].filter((p): p is string => p !== null);

  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    // Dev toolchain (Forge/Vite) may set ANTHROPIC_API_KEY="" before main runs.
    // dotenv skips existing keys by default — override so repo .env wins.
    const result = config({ path: envPath, override: true });
    const loaded = !result.error;
    envLoadResult = { loaded, path: envPath };
    const keyInProcess = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    needleLog('env', loaded ? 'loaded .env' : 'failed to load .env', {
      path: envPath,
      parsedKeys: result.parsed ? Object.keys(result.parsed) : [],
      keyAppliedToProcess: keyInProcess,
    });
    return envLoadResult;
  }

  envLoadResult = { loaded: false, path: null };
  needleLog('env', 'no .env file found', { tried: candidates });
  return envLoadResult;
}

export function getEnvLoadResult(): EnvLoadResult {
  return envLoadResult;
}
