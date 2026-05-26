import { ipcMain, BrowserWindow, nativeTheme } from 'electron';
import type {
  CaptureClosePayload,
  CaptureEntryPayload,
  CapturePromotePayload,
  CaptureShowPayload,
  TorchClosePayload,
  TorchShowPayload,
} from '../../shared/ipc-contracts';
import { hideCapture, showCapture } from '../windows/capture';
import { hideTorch, setTorchDismissHandler, showTorch } from '../windows/torch';

function findMainAppWindow(): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find(
    (w) =>
      !w.webContents.getURL().includes('mode=torch') &&
      !w.webContents.getURL().includes('mode=capture') &&
      !w.webContents.getURL().includes('mode=hero-banner'),
  );
}

export function registerIpcHandlers(): void {
  // System notification click → ask main-app renderer to acknowledge the torch.
  setTorchDismissHandler((correlationId) => {
    findMainAppWindow()?.webContents.send('torch:closed', {
      correlationId,
      reason: 'acknowledged',
    });
    hideTorch();
  });

  ipcMain.handle('app:getTheme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.on('navigate', (_event, screen: string) => {
    const win = findMainAppWindow();
    if (win) win.webContents.send('navigate', screen);
  });

  // Torch
  ipcMain.on('torch:show', (_event, payload: TorchShowPayload) => {
    showTorch(payload);
  });
  ipcMain.on('torch:hide', () => {
    hideTorch();
  });
  ipcMain.on('torch:dismiss', (_event, payload: TorchClosePayload) => {
    findMainAppWindow()?.webContents.send('torch:closed', payload);
    hideTorch();
  });

  // Capture
  ipcMain.on('capture:show', (_event, payload: CaptureShowPayload) => {
    showCapture(payload);
  });
  ipcMain.on('capture:hide', () => {
    hideCapture();
  });
  ipcMain.on('capture:add-entry', (_event, payload: CaptureEntryPayload) => {
    findMainAppWindow()?.webContents.send('capture:entry-added', payload);
  });
  ipcMain.on('capture:promote-entry', (_event, payload: CapturePromotePayload) => {
    findMainAppWindow()?.webContents.send('capture:entry-promoted', payload);
  });
  ipcMain.on('capture:dismiss-entry', (_event, payload: CapturePromotePayload) => {
    findMainAppWindow()?.webContents.send('capture:entry-dismissed', payload);
  });
  ipcMain.on('capture:close', (_event, payload: CaptureClosePayload) => {
    findMainAppWindow()?.webContents.send('capture:closed', payload);
    hideCapture();
  });
}
