import { contextBridge, ipcRenderer } from 'electron';
import type { Theme, Screen, Task, CaptureResult, ClassifiedItem } from '../shared/types';
import type { IpcContracts } from '../shared/ipc-contracts';

type InvokeChannel = keyof IpcContracts;

function invoke<K extends InvokeChannel>(
  channel: K,
  payload: IpcContracts[K]['req'],
): Promise<IpcContracts[K]['res']> {
  return ipcRenderer.invoke(channel, payload) as Promise<IpcContracts[K]['res']>;
}

const api = {
  app: {
    getTheme: (): Promise<Theme> => ipcRenderer.invoke('app:getTheme'),
    onNavigate: (cb: (screen: Screen) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, screen: Screen) => cb(screen);
      ipcRenderer.on('navigate', handler);
      return () => ipcRenderer.removeListener('navigate', handler);
    },
  },
  tasks: {
    classify: (req: { rawInput: string }): Promise<CaptureResult> => invoke('tasks:classify', req),
    confirm: (req: { rawInput: string; items: ClassifiedItem[] }): Promise<Task[]> =>
      invoke('tasks:confirm', req),
    list: (req: { scope: 'today' }): Promise<Task[]> => invoke('tasks:list', req),
    setDone: (req: { id: string; done: boolean }): Promise<void> => invoke('tasks:setDone', req),
  },
} as const;

contextBridge.exposeInMainWorld('api', api);
