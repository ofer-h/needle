import { BrowserWindow, Notification, screen } from 'electron';
import path from 'node:path';
import type { TorchShowPayload } from '../../shared/ipc-contracts';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const HERO_HEIGHT = 64;

let torchWindows: BrowserWindow[] = [];
let heroBannerWindow: BrowserWindow | null = null;
let activeNotification: Notification | null = null;
let currentPayload: TorchShowPayload | null = null;
let dismissHandler: ((correlationId: string) => void) | null = null;
let cursorPollHandle: ReturnType<typeof setInterval> | null = null;

const CURSOR_POLL_INTERVAL_MS = 33; // ~30fps

export function setTorchDismissHandler(fn: ((correlationId: string) => void) | null): void {
  dismissHandler = fn;
}

function isAnyOpen(): boolean {
  return (
    torchWindows.some((w) => !w.isDestroyed()) ||
    (heroBannerWindow !== null && !heroBannerWindow.isDestroyed())
  );
}

function pushPayloadToAll(): void {
  if (currentPayload === null) return;
  torchWindows.forEach((w) => {
    if (!w.isDestroyed()) w.webContents.send('torch:payload', currentPayload);
  });
  if (heroBannerWindow !== null && !heroBannerWindow.isDestroyed()) {
    heroBannerWindow.webContents.send('torch:payload', currentPayload);
  }
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
    focusable: true,
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

function createHeroBannerForDisplay(display: Electron.Display): BrowserWindow {
  const { x, y, width } = display.bounds;

  const win = new BrowserWindow({
    x,
    y: y + 16,
    width: Math.min(width - 32, 720),
    height: HERO_HEIGHT,
    transparent: true,
    frame: false,
    hasShadow: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
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

  // Center horizontally on the display.
  const bounds = win.getBounds();
  const centerX = Math.round(x + (width - bounds.width) / 2);
  win.setBounds({ ...bounds, x: centerX });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  win.webContents.on('did-finish-load', () => {
    if (currentPayload !== null) win.webContents.send('torch:payload', currentPayload);
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}?mode=hero-banner`);
  } else {
    win.loadFile(path.join(__dirname, `renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
      search: 'mode=hero-banner',
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

export function showTorch(payload: TorchShowPayload): void {
  currentPayload = payload;

  if (isAnyOpen()) {
    pushPayloadToAll();
    torchWindows.forEach((w) => {
      if (!w.isDestroyed()) w.show();
    });
    heroBannerWindow?.show();
    return;
  }

  // Find the display the cursor is on so we can put the hero banner there.
  const cursorPoint = screen.getCursorScreenPoint();
  const focusedDisplay = screen.getDisplayNearestPoint(cursorPoint);

  // 1) Torch overlay on every display.
  torchWindows = screen.getAllDisplays().map((d) => createTorchWindowForDisplay(d));

  // 2) Hero banner on the focused display.
  heroBannerWindow = createHeroBannerForDisplay(focusedDisplay);
  heroBannerWindow.on('closed', () => {
    heroBannerWindow = null;
  });

  // 3) Native macOS notification.
  fireSystemNotification(payload);

  // 4) Start broadcasting absolute cursor position to torch windows so each
  //    one can decide whether the cursor is on its display (show spotlight)
  //    or not (uniform dim — no stuck spotlight).
  startCursorPolling();
}

export function hideTorch(): void {
  stopCursorPolling();

  torchWindows.forEach((w) => {
    if (!w.isDestroyed()) w.close();
  });
  torchWindows = [];

  if (heroBannerWindow !== null && !heroBannerWindow.isDestroyed()) {
    heroBannerWindow.close();
  }
  heroBannerWindow = null;

  if (activeNotification !== null) {
    activeNotification.close();
    activeNotification = null;
  }

  currentPayload = null;
}
