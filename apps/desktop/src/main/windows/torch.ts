import { BrowserWindow, Notification, screen, WebContents } from 'electron';
import path from 'node:path';
import type { TorchHeroPayload, TorchShowPayload } from '@needle/contract';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let torchWindows: BrowserWindow[] = [];
let activeNotification: Notification | null = null;
let currentPayload: TorchShowPayload | null = null;
let dismissHandler: ((correlationId: string) => void) | null = null;
let cursorPollHandle: ReturnType<typeof setInterval> | null = null;
/** True while skip or brain-dump panels are active — polling must not override full interactivity. */
let overlaysFullyInteractive = false;

const CURSOR_POLL_INTERVAL_MS = 33; // ~30fps

/** Height of the embedded TorchBanner strip (matches TorchBanner.css `height: 48px`). */
const BANNER_HEIGHT = 48;
/** Top offset of the banner inside the overlay (matches TorchBanner.css `top: 16px`). */
const BANNER_TOP_OFFSET = 16;

export function setTorchDismissHandler(fn: ((correlationId: string) => void) | null): void {
  dismissHandler = fn;
}

function isAnyOpen(): boolean {
  return torchWindows.some((w) => !w.isDestroyed());
}

function pushPayloadToAll(): void {
  if (currentPayload === null) return;
  torchWindows.forEach((w) => {
    if (!w.isDestroyed()) w.webContents.send('torch:payload', currentPayload);
  });
}

function createTorchWindowForDisplay(display: Electron.Display): BrowserWindow {
  const { x, y, width, height } = display.bounds;

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Default: pass-through. The cursor-poll loop toggles this to false when over the banner.
  win.setIgnoreMouseEvents(true, { forward: true });

  win.webContents.on('did-finish-load', () => {
    if (currentPayload !== null) win.webContents.send('torch:payload', currentPayload);
  });

  win.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    const allowed =
      parsedUrl.protocol === 'file:' ||
      (MAIN_WINDOW_VITE_DEV_SERVER_URL && url.startsWith(MAIN_WINDOW_VITE_DEV_SERVER_URL));
    if (!allowed) event.preventDefault();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}?mode=torch`);
  } else {
    win.loadFile(path.join(__dirname, `renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
      search: 'mode=torch',
    });
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
}

function startCursorPolling(): void {
  if (cursorPollHandle !== null) return;
  cursorPollHandle = setInterval(() => {
    if (torchWindows.length === 0) return;
    const point = screen.getCursorScreenPoint();
    torchWindows.forEach((w) => {
      if (!w.isDestroyed()) {
        w.webContents.send('torch:cursor', point);

        // Toggle click-through based on whether the cursor is over the embedded banner.
        // Skip this logic when panels are fully interactive (skip / brain-dump modes).
        if (!overlaysFullyInteractive) {
          const { x, y, width } = w.getBounds();
          const bannerWidth = Math.min(width - 32, 720);
          const bannerX = x + (width - bannerWidth) / 2;
          const bannerY = y + BANNER_TOP_OFFSET;
          const overBanner =
            point.x >= bannerX &&
            point.x <= bannerX + bannerWidth &&
            point.y >= bannerY &&
            point.y <= bannerY + BANNER_HEIGHT;
          w.setIgnoreMouseEvents(!overBanner, { forward: true });
        }
      }
    });
  }, CURSOR_POLL_INTERVAL_MS);
}

function stopCursorPolling(): void {
  if (cursorPollHandle !== null) {
    clearInterval(cursorPollHandle);
    cursorPollHandle = null;
  }
}

function fireSystemNotification(payload: TorchShowPayload): void {
  if (!Notification.isSupported()) return;
  if (activeNotification !== null) {
    activeNotification.close();
  }
  const notification = new Notification({
    title: payload.title,
    body: payload.subtitle,
    urgency: 'critical',
    silent: false,
  });
  notification.on('click', () => {
    dismissHandler?.(payload.correlationId);
  });
  notification.show();
  activeNotification = notification;
}

export function broadcastSnoozedToOverlays(snoozeMs: number): void {
  torchWindows.forEach((w) => {
    if (!w.isDestroyed()) w.webContents.send('torch:snoozed', { snoozeMs });
  });
}

export function scheduleTorchReactivation(snoozeMs: number): void {
  setTimeout(() => {
    pushPayloadToAll();
  }, snoozeMs);
}

function broadcastHero(heroPayload: TorchHeroPayload): void {
  torchWindows.forEach((w) => {
    if (!w.isDestroyed()) w.webContents.send('torch:hero', heroPayload);
  });
}

function makeOverlaysInteractive(): void {
  overlaysFullyInteractive = true;
  torchWindows.forEach((w) => {
    if (!w.isDestroyed()) {
      w.setIgnoreMouseEvents(false);
      w.setFocusable(true);
    }
  });
}

function makeOverlaysPassThrough(): void {
  overlaysFullyInteractive = false;
  torchWindows.forEach((w) => {
    if (!w.isDestroyed()) {
      w.setIgnoreMouseEvents(true, { forward: true });
      w.setFocusable(false);
    }
  });
}

/** Toggle a single overlay window's interactivity based on the sender WebContents.
 * Called from the IPC handler for 'torch:set-interactive'. */
export function setWindowInteractive(sender: WebContents, interactive: boolean): void {
  const win = BrowserWindow.fromWebContents(sender);
  if (win === null || win.isDestroyed()) return;
  if (interactive) {
    win.setIgnoreMouseEvents(false);
    win.setFocusable(true);
  } else {
    win.setIgnoreMouseEvents(true, { forward: true });
    win.setFocusable(false);
  }
}

export function enterSkipMode(): void {
  makeOverlaysInteractive();
  broadcastHero({ mode: 'skip' });
}

export function exitSkipMode(): void {
  makeOverlaysPassThrough();
  broadcastHero({ mode: 'normal' });
}

export function enterBrainDumpMode(): void {
  makeOverlaysInteractive();
  broadcastHero({ mode: 'brain-dump' });
}

export function exitBrainDumpMode(): void {
  makeOverlaysPassThrough();
  broadcastHero({ mode: 'normal' });
}

export function showTorch(payload: TorchShowPayload): void {
  currentPayload = payload;

  if (isAnyOpen()) {
    pushPayloadToAll();
    torchWindows.forEach((w) => {
      if (!w.isDestroyed()) w.show();
    });
    return;
  }

  // Torch overlay on every display — banner is now embedded inside each overlay.
  torchWindows = screen.getAllDisplays().map((d) => createTorchWindowForDisplay(d));

  // Native macOS notification.
  fireSystemNotification(payload);

  // Start broadcasting absolute cursor position so each overlay can render
  // the spotlight only on the display where the cursor actually is.
  startCursorPolling();
}

export function hideTorch(): void {
  overlaysFullyInteractive = false;
  stopCursorPolling();

  torchWindows.forEach((w) => {
    if (!w.isDestroyed()) w.close();
  });
  torchWindows = [];

  if (activeNotification !== null) {
    activeNotification.close();
    activeNotification = null;
  }

  currentPayload = null;
}
