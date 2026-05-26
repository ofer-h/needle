import { contextBridge, ipcRenderer } from 'electron';
import type { Screen, Theme } from '../shared/types';
import type {
  CaptureClosePayload,
  CaptureEntryPayload,
  CapturePromotePayload,
  CaptureShowPayload,
  TorchClosePayload,
  TorchShowPayload,
} from '../shared/ipc-contracts';

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
  capture: {
    show: (payload: CaptureShowPayload): void => {
      ipcRenderer.send('capture:show', payload);
    },
    hide: (): void => {
      ipcRenderer.send('capture:hide');
    },
    addEntry: (payload: CaptureEntryPayload): void => {
      ipcRenderer.send('capture:add-entry', payload);
    },
    promoteEntry: (payload: CapturePromotePayload): void => {
      ipcRenderer.send('capture:promote-entry', payload);
    },
    dismissEntry: (payload: CapturePromotePayload): void => {
      ipcRenderer.send('capture:dismiss-entry', payload);
    },
    close: (payload: CaptureClosePayload): void => {
      ipcRenderer.send('capture:close', payload);
    },
    onPayload: (cb: (payload: CaptureShowPayload) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: CaptureShowPayload) => cb(payload);
      ipcRenderer.on('capture:payload', handler);
      return () => ipcRenderer.removeListener('capture:payload', handler);
    },
    onEntryAdded: (cb: (payload: CaptureEntryPayload) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: CaptureEntryPayload) => cb(payload);
      ipcRenderer.on('capture:entry-added', handler);
      return () => ipcRenderer.removeListener('capture:entry-added', handler);
    },
    onEntryPromoted: (cb: (payload: CapturePromotePayload) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: CapturePromotePayload) => cb(payload);
      ipcRenderer.on('capture:entry-promoted', handler);
      return () => ipcRenderer.removeListener('capture:entry-promoted', handler);
    },
    onEntryDismissed: (cb: (payload: CapturePromotePayload) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: CapturePromotePayload) => cb(payload);
      ipcRenderer.on('capture:entry-dismissed', handler);
      return () => ipcRenderer.removeListener('capture:entry-dismissed', handler);
    },
    onClosed: (cb: (payload: CaptureClosePayload) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: CaptureClosePayload) => cb(payload);
      ipcRenderer.on('capture:closed', handler);
      return () => ipcRenderer.removeListener('capture:closed', handler);
    },
  },
} as const;

contextBridge.exposeInMainWorld('api', api);
