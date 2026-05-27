import { create } from 'zustand';
import type { Screen, Theme, TimeSlot, Task, CalendarEvent } from '../../shared/types';

type AppState = {
  screen: Screen;
  theme: Theme;
  tasks: Task[];
  events: CalendarEvent[];
  expandedItemId: string | null;
  hydrateFromDb: () => Promise<void>;
  setScreen: (screen: Screen) => void;
  setTheme: (theme: Theme) => void;
  expandItem: (id: string | null) => void;
  toggleDone: (id: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  setNotes: (taskId: string, notes: string) => void;
  setLeadTime: (taskId: string, leadTimeMins: number | undefined) => void;
  planTaskForDate: (
    taskId: string,
    date: string | null,
    dateLabel: string,
    timeSlot: TimeSlot,
  ) => void;
  changeBucket: (taskId: string, bucket: Task['bucket']) => void;
  deleteTask: (taskId: string) => void;
  reorderTask: (id: string, newSlotIndex: number, newSlotOrder: number) => void;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyReorder(tasks: Task[], id: string, newSlotIndex: number, newSlotOrder: number): Task[] {
  const updated = tasks.map((t) =>
    t.id === id ? { ...t, slotIndex: newSlotIndex, slotOrder: newSlotOrder } : t,
  );

  const tasksInSlot = updated
    .filter((t) => t.scheduleKind === 'flexible' && t.slotIndex === newSlotIndex)
    .sort((a, b) => a.slotOrder - b.slotOrder);

  const needsRenumber = tasksInSlot.some((t, i) => {
    const next = tasksInSlot[i + 1];
    return next !== undefined && Math.abs(next.slotOrder - t.slotOrder) < 1;
  });

  if (!needsRenumber) return updated;

  const renumbered = new Map<string, number>();
  tasksInSlot.forEach((t, i) => renumbered.set(t.id, i * 100));

  return updated.map((t) => {
    const newOrder = renumbered.get(t.id);
    return newOrder !== undefined ? { ...t, slotOrder: newOrder } : t;
  });
}

function slotFieldsChanged(before: Task, after: Task): boolean {
  return before.slotIndex !== after.slotIndex || before.slotOrder !== after.slotOrder;
}

async function persistTaskPatch(id: string, patch: Partial<Task>): Promise<Task | null> {
  try {
    return await window.api.db.updateTask(id, patch);
  } catch {
    return null;
  }
}

async function persistFullTask(task: Task): Promise<void> {
  const { id, ...rest } = task;
  await persistTaskPatch(id, rest);
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'today',
  theme: 'light',
  tasks: [],
  events: [],
  expandedItemId: null,

  hydrateFromDb: async () => {
    const [tasks, events] = await Promise.all([
      window.api.db.getTasks(),
      window.api.db.getEvents(),
    ]);
    set({ tasks, events });
  },

  setScreen: (screen) => set({ screen }),
  setTheme: (theme) => set({ theme }),
  expandItem: (id) => set({ expandedItemId: id }),

  toggleDone: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const done = !task.done;
    set({
      tasks: get().tasks.map((t) => (t.id === id ? { ...t, done } : t)),
    });
    void persistTaskPatch(id, { done }).then((saved) => {
      if (saved) {
        set({ tasks: get().tasks.map((t) => (t.id === id ? saved : t)) });
      }
    });
  },

  addSubtask: (taskId, title) => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) return;

    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const next: Task = {
      ...task,
      subtasks: [
        ...(task.subtasks ?? []),
        { id: createId('subtask'), title: trimmedTitle, done: false },
      ],
    };
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? next : t)) });
    void persistFullTask(next);
  },

  toggleSubtask: (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const next: Task = {
      ...task,
      subtasks: (task.subtasks ?? []).map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
      ),
    };
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? next : t)) });
    void persistFullTask(next);
  },

  removeSubtask: (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const next: Task = {
      ...task,
      subtasks: (task.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId),
    };
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? next : t)) });
    void persistFullTask(next);
  },

  setNotes: (taskId, notes) => {
    set({
      tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, notes } : t)),
    });
    void persistTaskPatch(taskId, { notes });
  },

  setLeadTime: (taskId, leadTimeMins) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    let next: Task;
    if (leadTimeMins === undefined) {
      next = { ...task };
      delete next.leadTimeMins;
    } else {
      next = { ...task, leadTimeMins };
    }
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? next : t)) });
    void persistFullTask(next);
  },

  planTaskForDate: (taskId, date, dateLabel, timeSlot) => {
    const patch = { date, dateLabel, timeSlot, isOverdue: false as const };
    set({
      tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
    });
    void persistTaskPatch(taskId, patch).then((saved) => {
      if (saved) {
        set({ tasks: get().tasks.map((t) => (t.id === taskId ? saved : t)) });
      }
    });
  },

  changeBucket: (taskId, bucket) => {
    set({
      tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, bucket } : t)),
    });
    void persistTaskPatch(taskId, { bucket });
  },

  deleteTask: (taskId) => {
    set({
      tasks: get().tasks.filter((t) => t.id !== taskId),
      expandedItemId: get().expandedItemId === taskId ? null : get().expandedItemId,
    });
    void window.api.db.deleteTask(taskId);
  },

  reorderTask: (id, newSlotIndex, newSlotOrder) => {
    const prev = get().tasks;
    const next = applyReorder(prev, id, newSlotIndex, newSlotOrder);
    set({ tasks: next });

    const changed = next.filter((task) => {
      const before = prev.find((t) => t.id === task.id);
      return before !== undefined && slotFieldsChanged(before, task);
    });

    void Promise.all(
      changed.map((task) =>
        persistTaskPatch(task.id, {
          slotIndex: task.slotIndex,
          slotOrder: task.slotOrder,
        }),
      ),
    ).then((saved) => {
      const byId = new Map(saved.filter((t): t is Task => t !== null).map((t) => [t.id, t]));
      if (byId.size === 0) return;
      set({
        tasks: get().tasks.map((t) => byId.get(t.id) ?? t),
      });
    });
  },
}));
