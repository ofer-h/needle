import path from 'node:path';
import { config } from 'dotenv';
import { app } from 'electron';

/**
 * Load repo-root `.env` for local development only.
 *
 * With `electron-forge start`, the main bundle lives at `.vite/build/main.js`,
 * so `../../.env` resolves to the project root. Packaged apps skip this — use
 * `ANTHROPIC_API_KEY` in the environment or Capture → API key (userData).
 */
export function loadLocalEnv(): void {
  if (app.isPackaged) return;

  const envPath = path.join(__dirname, '../../.env');
  config({ path: envPath });
}
