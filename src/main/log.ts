import { app } from 'electron';

const PREFIX = '[needle]';

/** Dev-oriented main-process logs (terminal running `npm start`). Never log secrets. */
export function needleLog(scope: string, message: string, meta?: Record<string, unknown>): void {
  if (app.isPackaged) return;
  const suffix = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  console.log(`${PREFIX} [${scope}] ${message}${suffix}`);
}
