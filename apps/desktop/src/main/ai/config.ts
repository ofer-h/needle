import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

type UserConfig = {
  anthropicApiKey?: string;
};

function configPath(): string {
  return path.join(app.getPath('userData'), 'config.json');
}

function readUserConfig(): UserConfig {
  const filePath = configPath();
  if (!existsSync(filePath)) return {};
  try {
    const raw = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object') return {};
    const key = (parsed as UserConfig).anthropicApiKey;
    return typeof key === 'string' && key.trim().length > 0
      ? { anthropicApiKey: key.trim() }
      : {};
  } catch {
    return {};
  }
}

/**
 * API key resolution (first match wins; never log key values):
 * 1. `process.env.ANTHROPIC_API_KEY` — OS/shell, or repo-root `.env` in dev (`load-env.ts`)
 * 2. `userData/config.json` `anthropicApiKey` — Capture UI / `saveApiKey()`
 */
export function getApiKey(): string | null {
  const fromEnv = process.env.ANTHROPIC_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  return readUserConfig().anthropicApiKey ?? null;
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

export function getApiKeySource(): 'env' | 'config' | 'none' {
  const fromEnv = process.env.ANTHROPIC_API_KEY?.trim();
  if (fromEnv) return 'env';
  const fromFile = readUserConfig().anthropicApiKey;
  return fromFile ? 'config' : 'none';
}

export function saveApiKey(apiKey: string): { ok: true } | { error: string } {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    return { error: 'API key cannot be empty' };
  }
  const filePath = configPath();
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  let existing: UserConfig = {};
  if (existsSync(filePath)) {
    existing = readUserConfig();
  }
  try {
    writeFileSync(
      filePath,
      JSON.stringify({ ...existing, anthropicApiKey: trimmed }, null, 2),
      'utf8',
    );
    return { ok: true };
  } catch {
    return { error: 'Failed to save API key' };
  }
}
