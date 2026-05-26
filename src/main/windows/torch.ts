import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import type { TorchShowPayload } from '../../shared/ipc-contracts';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let torchWindow: BrowserWindow | null = null;
let currentPayload: TorchShowPayload | null = null;

function isOpen(): boolean {
  return torchWindow !== null && !torchWindow.isDestroyed();
}

function pushPayload(): void {
  if (!isOpen() || currentPayload === null) return;
  torchWindow?.webContents.send('torch:payload', currentPayload);
}

export function showTorch(payload: TorchShowPayload): void {
  currentPayload = payload;
  if (isOpen()) {
    pushPayload();
    torchWindow?.show();
    return;
  }

  const primary = screen.getPrimaryDisplay();
  const { x, y, width, height } = primary.bounds;

  torchWindow = new BrowserWindow({
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

  torchWindow.setAlwaysOnTop(true, 'screen-saver');
  torchWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  torchWindow.on('closed', () => {
    torchWindow = null;
    currentPayload = null;
  });

  torchWindow.webContents.on('did-finish-load', () => {
    pushPayload();
  });

  torchWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    const allowed =
      parsedUrl.protocol === 'file:' ||
      (MAIN_WINDOW_VITE_DEV_SERVER_URL && url.startsWith(MAIN_WINDOW_VITE_DEV_SERVER_URL));
    if (!allowed) event.preventDefault();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    torchWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}?mode=torch`);
  } else {
    torchWindow.loadFile(path.join(__dirname, `renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {
      search: 'mode=torch',
    });
  }

  torchWindow.once('ready-to-show', () => {
    torchWindow?.show();
    torchWindow?.focus();
  });
}

export function hideTorch(): void {
  if (!isOpen()) return;
  torchWindow?.close();
  torchWindow = null;
  currentPayload = null;
}
