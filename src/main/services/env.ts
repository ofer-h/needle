import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(contents: string): void {
  for (const line of contents.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadEnvFromPaths(paths: string[]): void {
  for (const filePath of paths) {
    try {
      if (!fs.existsSync(filePath)) continue;
      parseEnvFile(fs.readFileSync(filePath, 'utf8'));
    } catch {
      // ignore unreadable env files
    }
  }
}

export function loadProjectEnv(): void {
  loadEnvFromPaths([path.join(process.cwd(), '.env')]);
}
