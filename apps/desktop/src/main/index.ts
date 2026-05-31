import { loadLocalEnv } from './load-env';
import { needleLog } from './log';
import { getAppDiagnostics } from './diagnostics';
import { app, BrowserWindow, globalShortcut, session } from 'electron';

loadLocalEnv();
import { close, open } from './db';
import { seedIfEmpty } from './db/seed';
import { createMainWindow } from './windows/main';
import { buildMenu } from './menu';
import { registerIpcHandlers } from './ipc/index';

let mainWindow: BrowserWindow | null = null;

// Returns the live main window, recreating it if it was closed/destroyed.
// On macOS the app stays alive after the window closes, so a stale reference
// to a destroyed BrowserWindow must never be used (it throws "Object has been
// destroyed"). This is the single source of truth for the main window.
function ensureMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  const win = createMainWindow();
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
  mainWindow = win;
  return win;
}

function bootstrap(): void {
  const database = open();
  seedIfEmpty(database);

  buildMenu();
  registerIpcHandlers();

  const diag = getAppDiagnostics();
  needleLog('boot', 'ready', {
    version: diag.version,
    gitSha: diag.gitSha,
    apiKeySource: diag.apiKeySource,
    envFile: diag.envFilePath,
  });

  // Deny all permission requests by default
  const allowedPermissions = ['media' as const]; // allow microphone for voice capture
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback((allowedPermissions as any[]).includes(permission));
  });

  ensureMainWindow();

  // Global shortcut: ⌘K to open/focus Capture
  globalShortcut.register('CommandOrControl+K', () => {
    const win = ensureMainWindow();
    if (!win.isVisible()) win.show();
    win.focus();
    win.webContents.send('navigate', 'capture');
  });
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    ensureMainWindow();
  } else {
    mainWindow?.show();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  close();
});
