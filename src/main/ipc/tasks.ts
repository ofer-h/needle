import { ipcMain } from 'electron';
import { createTask, listTodayTasks, setTaskDone } from '../services/tasks';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function registerTaskHandlers(): void {
  ipcMain.handle('tasks:create', (_event, payload: unknown) => {
    if (!payload || typeof payload !== 'object' || !('rawInput' in payload)) {
      throw new Error('Invalid tasks:create payload');
    }
    const { rawInput } = payload as { rawInput: unknown };
    if (!isNonEmptyString(rawInput)) {
      throw new Error('tasks:create requires non-empty rawInput');
    }
    return createTask(rawInput);
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
