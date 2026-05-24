import { ipcMain } from 'electron';
import type { ClassifiedItem } from '../../shared/types';
import { classifyOnly, confirmTasks, listTodayTasks, setTaskDone } from '../services/tasks';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isClassifiedItem(value: unknown): value is ClassifiedItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.title === 'string' &&
    item.title.trim().length > 0 &&
    (item.bucket === 'act' || item.bucket === 'remember') &&
    typeof item.timeSlot === 'string'
  );
}

export function registerTaskHandlers(): void {
  ipcMain.handle('tasks:classify', async (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object' || !('rawInput' in payload)) {
      throw new Error('Invalid tasks:classify payload');
    }
    const { rawInput } = payload as { rawInput: unknown };
    if (!isNonEmptyString(rawInput)) {
      throw new Error('tasks:classify requires non-empty rawInput');
    }
    return classifyOnly(rawInput);
  });

  ipcMain.handle('tasks:confirm', (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object' || !('rawInput' in payload) || !('items' in payload)) {
      throw new Error('Invalid tasks:confirm payload');
    }
    const { rawInput, items } = payload as { rawInput: unknown; items: unknown };
    if (!isNonEmptyString(rawInput)) {
      throw new Error('tasks:confirm requires non-empty rawInput');
    }
    if (!Array.isArray(items) || items.length === 0 || !items.every(isClassifiedItem)) {
      throw new Error('tasks:confirm requires non-empty items array');
    }
    return confirmTasks(rawInput, items);
  });

  ipcMain.handle('tasks:list', (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object' || !('scope' in payload)) {
      throw new Error('Invalid tasks:list payload');
    }
    const { scope } = payload as { scope: unknown };
    if (scope !== 'today') {
      throw new Error('tasks:list only supports scope "today"');
    }
    return listTodayTasks();
  });

  ipcMain.handle('tasks:setDone', (_event, payload: unknown) => {
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('id' in payload) ||
      !('done' in payload)
    ) {
      throw new Error('Invalid tasks:setDone payload');
    }
    const { id, done } = payload as { id: unknown; done: unknown };
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('tasks:setDone requires id');
    }
    if (typeof done !== 'boolean') {
      throw new Error('tasks:setDone requires boolean done');
    }
    setTaskDone(id, done);
  });
}
