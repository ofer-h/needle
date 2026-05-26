import { ipcMain, BrowserWindow, nativeTheme } from 'electron';

export function registerIpcHandlers(): void {
  // Theme query — return system appearance
  ipcMain.handle('app:getTheme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  // Navigate command sent from menu
  ipcMain.on('navigate', (_event, screen: string) => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) win.webContents.send('navigate', screen);
  });
}
