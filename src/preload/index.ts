import { contextBridge, ipcRenderer } from 'electron';
import type { Screen, Theme } from '../shared/types';
import type { TorchClosePayload, TorchShowPayload } from '../shared/ipc-contracts';

const api = {
  app: {
    getTheme: (): Promise<Theme> => ipcRenderer.invoke('app:getTheme'),
    onNavigate: (cb: (screen: Screen) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, screen: Screen) => cb(screen);
      ipcRenderer.on('navigate', handler);
      return () => ipcRenderer.removeListener('navigate', handler);
    },
  },
  torch: {
    show: (payload: TorchShowPayload): void => {
      ipcRenderer.send('torch:show', payload);
    },
    hide: (): void => {
      ipcRenderer.send('torch:hide');
    },
    dismiss: (payload: TorchClosePayload): void => {
      ipcRenderer.send('torch:dismiss', payload);
    },
    onPayload: (cb: (payload: TorchShowPayload) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: TorchShowPayload) => cb(payload);
      ipcRenderer.on('torch:payload', handler);
      return () => ipcRenderer.removeListener('torch:payload', handler);
    },
    onClosed: (cb: (payload: TorchClosePayload) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: TorchClosePayload) => cb(payload);
      ipcRenderer.on('torch:closed', handler);
      return () => ipcRenderer.removeListener('torch:closed', handler);
    },
  },
} as const;

contextBridge.exposeInMainWorld('api', api);
