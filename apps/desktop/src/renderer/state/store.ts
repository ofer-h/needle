import { create } from 'zustand';
import type { Screen, Theme, TimeSlot, Task, CalendarEvent, ParsedPlanningItem } from '@needle/domain/types';

/** User's appearance preference. 'system' follows the OS; 'light'/'dark' pin it.
 * The resolved value lives in `theme` (always 'light' | 'dark'). */
export type Appearance = 'system' | 'light' | 'dark';

type AppState = {
  screen: Screen;
  /** Resolved theme actually applied to the DOM (derived from `appearance`). */
  theme: Theme;
  /** User's appearance preference (system / light / dark). */
  appearance: Appearance;
  tasks: Task[];
  events: CalendarEvent[];
  expandedItemId: string | null;
  hydrateFromDb: () => Promise<void>;
  setScreen: (screen: Screen) => void;
  setTheme: (theme: Theme) => void;
  setAppearance: (appearance: Appearance) => void;
  expandItem: (id: string | null) => void;
  setTaskTitle: (id: string, title: string) => void;
  toggleDone: (id: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, patch: { title?: string; notes?: string }) => void;
  reorderSubtask: (taskId: string, subtaskId: string, toIndex: number) => void;
  moveSubtask: (taskId: string, subtaskId: string, targetTaskId: string) => void;
  promoteSubtask: (taskId: string, subtaskId: string) => void;
  nestTask: (taskId: string, targetTaskId: string) => void;
  setNotes: (taskId: string, notes: string) => void;
  setLeadTime: (taskId: string, leadTimeMins: number | undefined) => void;
  planTaskForDate: (
    taskId: string,
    date: string | null,
    dateLabel: string,
    timeSlot: TimeSlot,
  ) => void;
  createPlanningItems: (input: { rawInput: string; items: ParsedPlanningItem[] }) => Promise<boolean>;
  changeBucket: (taskId: string, bucket: Task['bucket']) => void;
  deleteTask: (taskId: string) => void;
  reorderTask: (
    id: string,
    newSlotIndex: number,
    newSlotOrder: number,
    patch?: Partial<Pick<Task, 'date' | 'timeSlot' | 'isOverdue'>>,
  ) => void;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  convertEventToTask: (id: string) => void;
};

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

async function refreshPlanningData(set: (partial: Partial<AppState>) => void): Promise<void> {
  const [tasks, events] = await Promise.all([
    window.api.db.getTasks(),
    window.api.db.getEvents(),
  ]);
  set({ tasks, events });
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'today',
  theme: 'light',
  appearance: 'system',
  tasks: [],
  events: [],
  expandedItemId: null,

  hydrateFromDb: async () => {
    await refreshPlanningData(set);
  },

  setScreen: (screen) => set({ screen }),
  setTheme: (theme) => set({ theme }),
  setAppearance: (appearance) => set({ appearance }),
  expandItem: (id) => set({ expandedItemId: id }),

  setTaskTitle: (id, title) => {
    const trimmed = title.trim();
    if (trimmed.length === 0) return;
    set({
      tasks: get().tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t)),
    });
    void persistTaskPatch(id, { title: trimmed }).then((saved) => {
      if (saved) {
        set({ tasks: get().tasks.map((t) => (t.id === id ? saved : t)) });
      }
    });
  },

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

    void window.api.db.addSubtask(taskId, trimmedTitle).then((saved) => {
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? saved : t)) });
    });
  },

  toggleSubtask: (taskId, subtaskId) => {
    void window.api.db.toggleSubtask(taskId, subtaskId).then((saved) => {
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? saved : t)) });
    });
  },

  removeSubtask: (taskId, subtaskId) => {
    void window.api.db.removeSubtask(taskId, subtaskId).then((saved) => {
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? saved : t)) });
    });
  },

  updateSubtask: (taskId, subtaskId, patch) => {
    const tasks = get().tasks.map((task) => {
      if (task.id !== taskId || task.subtasks === undefined) return task;
      return {
        ...task,
        subtasks: task.subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, ...patch } : subtask,
        ),
      };
    });
    set({ tasks });
    void window.api.db.updateSubtask(taskId, subtaskId, patch).then((saved) => {
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? saved : t)) });
    });
  },

  reorderSubtask: (taskId, subtaskId, toIndex) => {
    const task = get().tasks.find((item) => item.id === taskId);
    if (task?.subtasks === undefined) return;
    const currentIndex = task.subtasks.findIndex((item) => item.id === subtaskId);
    if (currentIndex === -1) return;
    const nextSubtasks = [...task.subtasks];
    const [moved] = nextSubtasks.splice(currentIndex, 1);
    if (moved === undefined) return;
    const boundedIndex = Math.max(0, Math.min(toIndex, nextSubtasks.length));
    nextSubtasks.splice(boundedIndex, 0, moved);
    set({
      tasks: get().tasks.map((item) => (item.id === taskId ? { ...item, subtasks: nextSubtasks } : item)),
    });
    void window.api.db.reorderSubtask(taskId, subtaskId, toIndex);
  },

  moveSubtask: (taskId, subtaskId, targetTaskId) => {
    void window.api.db.moveSubtask(taskId, subtaskId, targetTaskId).then(async () => {
      await refreshPlanningData(set);
    });
  },

  promoteSubtask: (taskId, subtaskId) => {
    void window.api.db.promoteSubtask(taskId, subtaskId).then(async () => {
      await refreshPlanningData(set);
    });
  },

  nestTask: (taskId, targetTaskId) => {
    void window.api.db.nestTask(taskId, targetTaskId).then(async () => {
      await refreshPlanningData(set);
      if (get().expandedItemId === `task:${taskId}`) {
        set({ expandedItemId: null });
      }
    });
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
    if (leadTimeMins !== undefined) {
      void persistTaskPatch(taskId, { leadTimeMins });
    }
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

  createPlanningItems: async (input) => {
    try {
      const saved = await window.api.db.createPlanningItems(input);
      set({
        tasks: [...get().tasks, ...saved.tasks],
        events: [...get().events, ...saved.events],
      });
      return true;
    } catch {
      return false;
    }
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
      expandedItemId: get().expandedItemId === `task:${taskId}` ? null : get().expandedItemId,
    });
    void window.api.db.deleteTask(taskId);
  },

  reorderTask: (id, newSlotIndex, newSlotOrder, patch) => {
    const prev = get().tasks;
    const next = applyReorder(
      prev.map((task) => (task.id === id && patch !== undefined ? { ...task, ...patch } : task)),
      id,
      newSlotIndex,
      newSlotOrder,
    );
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
          ...(task.id === id && patch !== undefined ? patch : {}),
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

  updateEvent: (id, patch) => {
    set({
      events: get().events.map((event) => (event.id === id ? { ...event, ...patch } : event)),
    });
    void window.api.db.updateEvent(id, patch).then((saved) => {
      set({ events: get().events.map((event) => (event.id === id ? saved : event)) });
    });
  },

  deleteEvent: (id) => {
    set({
      events: get().events.filter((event) => event.id !== id),
      expandedItemId: get().expandedItemId === `event:${id}` ? null : get().expandedItemId,
    });
    void window.api.db.deleteEvent(id);
  },

  convertEventToTask: (id) => {
    void window.api.db.convertEventToTask(id).then(async () => {
      await refreshPlanningData(set);
      if (get().expandedItemId === `event:${id}`) {
        set({ expandedItemId: null });
      }
    });
  },
}));
