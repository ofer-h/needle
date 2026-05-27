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
 * Load repo-root `.env` for local development only.
 *
 * Tries `../../.env` from the compiled main bundle (Forge → `.vite/build/main.js`)
 * and `process.cwd()/.env` as a fallback when cwd is the project root.
 */
export function loadLocalEnv(): EnvLoadResult {
  if (app.isPackaged) {
    envLoadResult = { loaded: false, path: null };
    return envLoadResult;
  }

  const candidates = [
    path.join(__dirname, '../../.env'),
    path.join(process.cwd(), '.env'),
  ];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    const result = config({ path: envPath });
    const loaded = !result.error;
    envLoadResult = { loaded, path: envPath };
    needleLog('env', loaded ? 'loaded .env' : 'failed to load .env', {
      path: envPath,
      parsedKeys: result.parsed ? Object.keys(result.parsed) : [],
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
