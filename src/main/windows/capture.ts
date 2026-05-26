import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import type { CaptureShowPayload } from '../../shared/ipc-contracts';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

const CAPTURE_WIDTH = 600;
const CAPTURE_HEIGHT = 480;

let captureWindow: BrowserWindow | null = null;
let currentPayload: CaptureShowPayload | null = null;

function isOpen(): boolean {
  return captureWindow !== null && !captureWindow.isDestroyed();
}

function pushPayload(): void {
  if (!isOpen() || currentPayload === null) return;
  captureWindow?.webContents.send('capture:payload', currentPayload);
}

export function showCapture(payload: CaptureShowPayload): void {
  currentPayload = payload;
  if (isOpen()) {
    pushPayload();
    captureWindow?.show();
    captureWindow?.focus();
    return;
  }

  const cursorDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const x = Math.round(cursorDisplay.bounds.x + (cursorDisplay.bounds.width - CAPTURE_WIDTH) / 2);
  const y = Math.round(cursorDisplay.bounds.y + (cursorDisplay.bounds.height - CAPTURE_HEIGHT) / 3);

  captureWindow = new BrowserWindow({
    x,
    y,
    width: CAPTURE_WIDTH,
    height: CAPTURE_HEIGHT,
    transparent: true,
    frame: false,
    hasShadow: true,
    resizable: false,
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

  captureWindow.setAlwaysOnTop(true, 'floating');
  captureWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  captureWindow.on('closed', () => {
    captureWindow = null;
    currentPayload = null;
  });

  captureWindow.webContents.on('did-finish-load', () => {
    pushPayload();
  });

  captureWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    const allowed =
      parsedUrl.protocol === 'file:' ||
      (MAIN_WINDOW_VITE_DEV_SERVER_URL && url.startsWith(MAIN_WINDOW_VITE_DEV_SERVER_URL));
    if (!allowed) event.preventDefault();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    captureWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}?mode=capture`);
  } else {
    captureWindow.loadFile(path.join(__dirname, `renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
      search: 'mode=capture',
    });
  }

  captureWindow.once('ready-to-show', () => {
    captureWindow?.show();
    captureWindow?.focus();
  });
}

export function hideCapture(): void {
  if (!isOpen()) return;
  captureWindow?.close();
  captureWindow = null;
  currentPayload = null;
}
