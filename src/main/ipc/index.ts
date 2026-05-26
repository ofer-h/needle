import { ipcMain, BrowserWindow, nativeTheme } from 'electron';
import type { TorchClosePayload, TorchShowPayload } from '../../shared/ipc-contracts';
import { hideTorch, showTorch } from '../windows/torch';

function findMainAppWindow(): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find(
    (w) => !w.webContents.getURL().includes('mode=torch'),
  );
}

export function registerIpcHandlers(): void {
  ipcMain.handle('app:getTheme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.on('navigate', (_event, screen: string) => {
    const win = findMainAppWindow();
    if (win) win.webContents.send('navigate', screen);
  });

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
}
