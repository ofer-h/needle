import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { AppDiagnostics } from '../shared/ipc-contracts';
import { getEnvLoadResult } from './load-env';
import { getApiKeySource } from './ai/config';

export type { AppDiagnostics };

function readPackageVersion(): string {
  try {
    const pkgPath = path.join(app.getAppPath(), 'package.json');
    const raw = readFileSync(pkgPath, 'utf8');
    const parsed = JSON.parse(raw) as { version?: string };
    return typeof parsed.version === 'string' ? parsed.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function readGitSha(): string {
  if (app.isPackaged) return 'packaged';
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      cwd: app.getAppPath(),
    }).trim();
  } catch {
    return 'unknown';
  }
}

export function getAppDiagnostics(): AppDiagnostics {
  const env = getEnvLoadResult();
  const apiKeySource = getApiKeySource();
  return {
    version: readPackageVersion(),
    gitSha: readGitSha(),
    isPackaged: app.isPackaged,
    envFilePath: env.path,
    envFileLoaded: env.loaded,
    apiKeySource,
    hasApiKey: apiKeySource !== 'none',
  };
}
