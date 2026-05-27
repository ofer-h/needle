import { contextBridge, ipcRenderer } from 'electron';
import type { CalendarEvent, CaptureEntry, ClassifyResponse, Screen, Task, Theme } from '../shared/types';
import type {
  CaptureClosePayload,
  CaptureEntryPayload,
  CapturePromotePayload,
  CaptureShowPayload,
  DbAddCapturePayload,
  DbCreateEventPayload,
  DbCreateTaskPayload,
  DbDeleteTaskPayload,
  DbGetCapturePayload,
  DbGetTasksByDatePayload,
  DbUpdateTaskPayload,
  TorchBrainDumpSubmitPayload,
  TorchClosePayload,
  TorchHeroPayload,
  TorchSetInteractivePayload,
  TorchShowPayload,
  TorchSkipConfirmPayload,
  TorchSnoozePayload,
} from '../shared/ipc-contracts';

const api = {
  app: {
    getTheme: (): Promise<Theme> => ipcRenderer.invoke('app:getTheme'),
    getDiagnostics: () => ipcRenderer.invoke('app:getDiagnostics'),
    getFlowHealth: () => ipcRenderer.invoke('app:getFlowHealth'),
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
    snooze: (payload: TorchSnoozePayload): void => {
      ipcRenderer.send('torch:snooze', payload);
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
    onCursor: (cb: (point: { x: number; y: number }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, point: { x: number; y: number }) => cb(point);
      ipcRenderer.on('torch:cursor', handler);
      return () => ipcRenderer.removeListener('torch:cursor', handler);
    },
    onSnoozed: (cb: (payload: TorchSnoozePayload) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: TorchSnoozePayload) => cb(payload);
      ipcRenderer.on('torch:snoozed', handler);
      return () => ipcRenderer.removeListener('torch:snoozed', handler);
    },
    skipInit: (correlationId: string): void => {
      ipcRenderer.send('torch:skip-init', { correlationId });
    },
    skipConfirm: (payload: TorchSkipConfirmPayload): void => {
      ipcRenderer.send('torch:skip-confirm', payload);
    },
    skipCancel: (correlationId: string): void => {
      ipcRenderer.send('torch:skip-cancel', { correlationId });
    },
    onHero: (cb: (payload: TorchHeroPayload) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: TorchHeroPayload) => cb(payload);
      ipcRenderer.on('torch:hero', handler);
      return () => ipcRenderer.removeListener('torch:hero', handler);
    },
    brainDumpInit: (correlationId: string): void => {
      ipcRenderer.send('torch:brain-dump-init', { correlationId });
    },
    brainDumpSubmit: (payload: TorchBrainDumpSubmitPayload): void => {
      ipcRenderer.send('torch:brain-dump-submit', payload);
    },
    brainDumpCancel: (correlationId: string): void => {
      ipcRenderer.send('torch:brain-dump-cancel', { correlationId });
    },
    setInteractive: (interactive: boolean): void => {
      const payload: TorchSetInteractivePayload = { interactive };
      ipcRenderer.send('torch:set-interactive', payload);
    },
  },
  db: {
    getTasks: (): Promise<Task[]> => ipcRenderer.invoke('db:get-tasks'),
    getTasksByDate: (date: string): Promise<Task[]> =>
      ipcRenderer.invoke('db:get-tasks-by-date', { date } satisfies DbGetTasksByDatePayload),
    createTask: (payload: DbCreateTaskPayload): Promise<Task> =>
      ipcRenderer.invoke('db:create-task', payload),
    updateTask: (id: string, patch: Partial<Task>): Promise<Task> =>
      ipcRenderer.invoke('db:update-task', { id, patch } satisfies DbUpdateTaskPayload),
    deleteTask: (id: string): Promise<void> =>
      ipcRenderer.invoke('db:delete-task', { id } satisfies DbDeleteTaskPayload),
    getEvents: (): Promise<CalendarEvent[]> => ipcRenderer.invoke('db:get-events'),
    createEvent: (payload: DbCreateEventPayload): Promise<CalendarEvent> =>
      ipcRenderer.invoke('db:create-event', payload),
    addCapture: (body: string): Promise<CaptureEntry> =>
      ipcRenderer.invoke('db:add-capture', { body } satisfies DbAddCapturePayload),
    getCaptureEntries: (limit?: number): Promise<CaptureEntry[]> =>
      ipcRenderer.invoke(
        'db:get-capture-entries',
        limit === undefined ? {} : ({ limit } satisfies DbGetCapturePayload),
      ),
  },
  ai: {
    classify: (text: string): Promise<ClassifyResponse> =>
      ipcRenderer.invoke('ai:classify', { text }),
    setApiKey: (apiKey: string): Promise<{ ok: true } | { error: string }> =>
      ipcRenderer.invoke('ai:setApiKey', { apiKey }),
    hasApiKey: (): Promise<boolean> => ipcRenderer.invoke('ai:hasApiKey'),
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
