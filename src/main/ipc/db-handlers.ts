import { ipcMain } from 'electron';
import type {
  DbAddCapturePayload,
  DbAddSubtaskPayload,
  DbConvertEventPayload,
  DbCreatePlanningItemsPayload,
  DbDeleteEventPayload,
  DbDeleteTaskPayload,
  DbGetCapturePayload,
  DbMoveSubtaskPayload,
  DbNestTaskPayload,
  DbReorderSubtaskPayload,
  DbSubtaskPayload,
  DbUpdateTaskPayload,
  DbUpdateEventPayload,
  DbUpdateSubtaskPayload,
} from '@needle/contract';
import * as repo from '../db/repository';

export function registerDbHandlers(): void {
  ipcMain.handle('db:get-tasks', () => repo.getAllTasks());

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

  ipcMain.handle('db:add-subtask', (_event, payload: DbAddSubtaskPayload) => {
    if (!payload?.taskId || typeof payload.taskId !== 'string') {
      throw new Error('db:add-subtask requires taskId');
    }
    if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length === 0) {
      throw new Error('db:add-subtask requires title');
    }
    return repo.addSubtask(payload.taskId, payload.title);
  });

  ipcMain.handle('db:toggle-subtask', (_event, payload: DbSubtaskPayload) => {
    if (!payload?.taskId || typeof payload.taskId !== 'string' || !payload.subtaskId || typeof payload.subtaskId !== 'string') {
      throw new Error('db:toggle-subtask requires taskId and subtaskId');
    }
    return repo.toggleSubtask(payload.taskId, payload.subtaskId);
  });

  ipcMain.handle('db:remove-subtask', (_event, payload: DbSubtaskPayload) => {
    if (!payload?.taskId || typeof payload.taskId !== 'string' || !payload.subtaskId || typeof payload.subtaskId !== 'string') {
      throw new Error('db:remove-subtask requires taskId and subtaskId');
    }
    return repo.removeSubtask(payload.taskId, payload.subtaskId);
  });

  ipcMain.handle('db:update-subtask', (_event, payload: DbUpdateSubtaskPayload) => {
    if (!payload?.taskId || typeof payload.taskId !== 'string' || !payload.subtaskId || typeof payload.subtaskId !== 'string') {
      throw new Error('db:update-subtask requires taskId and subtaskId');
    }
    return repo.updateSubtask(payload.taskId, payload.subtaskId, payload.patch ?? {});
  });

  ipcMain.handle('db:reorder-subtask', (_event, payload: DbReorderSubtaskPayload) => {
    if (!payload?.taskId || typeof payload.taskId !== 'string' || !payload.subtaskId || typeof payload.subtaskId !== 'string') {
      throw new Error('db:reorder-subtask requires taskId and subtaskId');
    }
    if (typeof payload.toIndex !== 'number' || payload.toIndex < 0) {
      throw new Error('db:reorder-subtask requires a non-negative toIndex');
    }
    repo.reorderSubtask(payload.taskId, payload.subtaskId, payload.toIndex);
  });

  ipcMain.handle('db:move-subtask', (_event, payload: DbMoveSubtaskPayload) => {
    if (!payload?.taskId || typeof payload.taskId !== 'string' || !payload.subtaskId || typeof payload.subtaskId !== 'string' || !payload.targetTaskId || typeof payload.targetTaskId !== 'string') {
      throw new Error('db:move-subtask requires taskId, subtaskId, and targetTaskId');
    }
    repo.moveSubtask(payload.taskId, payload.subtaskId, payload.targetTaskId);
  });

  ipcMain.handle('db:promote-subtask', (_event, payload: DbSubtaskPayload) => {
    if (!payload?.taskId || typeof payload.taskId !== 'string' || !payload.subtaskId || typeof payload.subtaskId !== 'string') {
      throw new Error('db:promote-subtask requires taskId and subtaskId');
    }
    repo.promoteSubtask(payload.taskId, payload.subtaskId);
  });

  ipcMain.handle('db:nest-task', (_event, payload: DbNestTaskPayload) => {
    if (!payload?.taskId || typeof payload.taskId !== 'string' || !payload.targetTaskId || typeof payload.targetTaskId !== 'string') {
      throw new Error('db:nest-task requires taskId and targetTaskId');
    }
    repo.nestTask(payload.taskId, payload.targetTaskId);
  });

  ipcMain.handle('db:get-events', () => repo.getAllEvents());

  ipcMain.handle('db:update-event', (_event, payload: DbUpdateEventPayload) => {
    if (!payload?.id || typeof payload.id !== 'string') {
      throw new Error('db:update-event requires id');
    }
    return repo.updateEvent(payload.id, payload.patch ?? {});
  });

  ipcMain.handle('db:delete-event', (_event, payload: DbDeleteEventPayload) => {
    if (!payload?.id || typeof payload.id !== 'string') {
      throw new Error('db:delete-event requires id');
    }
    repo.deleteEvent(payload.id);
  });

  ipcMain.handle('db:convert-event-to-task', (_event, payload: DbConvertEventPayload) => {
    if (!payload?.id || typeof payload.id !== 'string') {
      throw new Error('db:convert-event-to-task requires id');
    }
    repo.convertEventToTask(payload.id);
  });

  ipcMain.handle('db:create-planning-items', (_event, payload: DbCreatePlanningItemsPayload) => {
    if (!payload || typeof payload.rawInput !== 'string' || !Array.isArray(payload.items)) {
      throw new Error('db:create-planning-items requires rawInput and items');
    }
    return repo.createPlanningItemsFromCapture({
      rawInput: payload.rawInput.trim(),
      items: payload.items,
    });
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
