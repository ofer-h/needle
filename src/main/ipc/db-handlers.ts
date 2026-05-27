import { ipcMain } from 'electron';
import type {
  DbAddCapturePayload,
  DbCreateEventPayload,
  DbCreateTaskPayload,
  DbDeleteTaskPayload,
  DbGetCapturePayload,
  DbGetTasksByDatePayload,
  DbUpdateTaskPayload,
} from '../../shared/ipc-contracts';
import * as repo from '../db/repository';

export function registerDbHandlers(): void {
  ipcMain.handle('db:get-tasks', () => repo.getAllTasks());

  ipcMain.handle('db:get-tasks-by-date', (_event, payload: DbGetTasksByDatePayload) => {
    if (typeof payload?.date !== 'string' || payload.date.length === 0) {
      throw new Error('db:get-tasks-by-date requires a non-empty date string');
    }
    return repo.getTasksByDate(payload.date);
  });

  ipcMain.handle('db:create-task', (_event, payload: DbCreateTaskPayload) => {
    if (!payload || typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      throw new Error('db:create-task requires a title');
    }
    return repo.createTask(payload);
  });

  ipcMain.handle('db:update-task', (_event, payload: DbUpdateTaskPayload) => {
    if (!payload?.id || typeof payload.id !== 'string') {
      throw new Error('db:update-task requires id');
    }
    return repo.updateTask(payload.id, payload.patch ?? {});
  });

  ipcMain.handle('db:delete-task', (_event, payload: DbDeleteTaskPayload) => {
    if (!payload?.id || typeof payload.id !== 'string') {
      throw new Error('db:delete-task requires id');
    }
    repo.deleteTask(payload.id);
  });

  ipcMain.handle('db:get-events', () => repo.getAllEvents());

  ipcMain.handle('db:create-event', (_event, payload: DbCreateEventPayload) => {
    if (!payload || typeof payload.label !== 'string' || payload.label.trim().length === 0) {
      throw new Error('db:create-event requires a label');
    }
    return repo.createEvent(payload);
  });

  ipcMain.handle('db:add-capture', (_event, payload: DbAddCapturePayload) => {
    if (!payload || typeof payload.body !== 'string' || payload.body.trim().length === 0) {
      throw new Error('db:add-capture requires body');
    }
    return repo.createCaptureEntry({ body: payload.body.trim() });
  });

  ipcMain.handle('db:get-capture-entries', (_event, payload: DbGetCapturePayload) => {
    const limit = payload?.limit;
    if (limit !== undefined && (typeof limit !== 'number' || limit < 1)) {
      throw new Error('db:get-capture-entries limit must be a positive number');
    }
    return repo.getRecentCaptureEntries(limit);
  });
}
