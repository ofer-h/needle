import type Database from 'better-sqlite3';
import type { ClassificationBucket, ParsedPlanningItem } from '@needle/domain/types';
import { buildSeedTasksAndEvents } from './seed-data';
import * as repo from './repository';

function bucketForSeed(timeSlot: string): ClassificationBucket {
  if (timeSlot === 'today') return 'today';
  if (timeSlot === 'tomorrow') return 'tomorrow';
  if (timeSlot === 'someday') return 'someday';
  return 'later';
}

export function seedIfEmpty(conn: Database.Database): void {
  if (repo.countTasks(conn) > 0 || repo.countV2Items(conn) > 0) return;

  const { tasks, events } = buildSeedTasksAndEvents();
  for (const task of tasks) {
    const created = repo.createPlanningItemsFromCapture(
      {
        rawInput: task.rawInput ?? task.title,
        items: [
          {
            id: task.id,
            itemType: 'task',
            scheduleMode: task.scheduleKind,
            title: task.title,
            bucket: bucketForSeed(task.timeSlot),
            ...(task.date !== null ? { suggestedDate: task.date } : {}),
            ...(task.startTime !== undefined ? { suggestedTime: task.startTime } : {}),
            reasoning: task.aiReason ?? task.sublabel ?? 'Seeded demo task.',
            confidence: 1,
          },
        ],
      },
      conn,
    ).tasks[0];
    if (created === undefined) continue;
    for (const subtask of task.subtasks ?? []) {
      const child = repo.addSubtask(created.id, subtask.title, conn);
      const createdSubtask = child.subtasks?.find((item) => item.title === subtask.title);
      if (subtask.done && createdSubtask !== undefined) {
        repo.toggleSubtask(created.id, createdSubtask.id, conn);
      }
    }
  }
  for (const event of events) {
    const item: ParsedPlanningItem = {
      id: event.id,
      itemType: 'event',
      scheduleMode: 'fixed',
      title: event.label,
      bucket: bucketForSeed(event.date === new Date().toISOString().slice(0, 10) ? 'today' : 'later'),
      suggestedDate: event.date,
      suggestedTime: event.startTime,
      reasoning: event.sublabel ?? 'Seeded demo event.',
      confidence: 1,
    };
    repo.createPlanningItemsFromCapture({ rawInput: event.label, items: [item] }, conn);
  }
}
