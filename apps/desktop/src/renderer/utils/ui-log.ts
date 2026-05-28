const PREFIX = '[needle-ui]';

/** Console logs for manual UI testing — open DevTools in the main window. */
export function uiLog(scope: string, message: string, meta?: Record<string, unknown>): void {
  const suffix = meta && Object.keys(meta).length > 0 ? meta : undefined;
  if (suffix !== undefined) {
    console.info(`${PREFIX} [${scope}] ${message}`, suffix);
  } else {
    console.info(`${PREFIX} [${scope}] ${message}`);
  }
}
