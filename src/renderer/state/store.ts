import { create } from 'zustand';
import type { Screen, Theme, TimeSlot, Task, CalendarEvent } from '../../shared/types';
import { addDaysISO, toISODate } from '../utils/date';

const TODAY = toISODate();
const YESTERDAY = addDaysISO(TODAY, -1);
const TOMORROW = addDaysISO(TODAY, 1);
const IN_THREE_DAYS = addDaysISO(TODAY, 3);

const MOCK_TASKS: Task[] = [
  {
    id: 'task-dana',
    title: 'Call back Dana',
    sublabel: 'from yesterday',
    kind: 'urgent',
    date: YESTERDAY,
    dateLabel: 'yesterday',
    datePill: 'urgent',
    done: false,
    bucket: 'act',
    timeSlot: 'today',
    rawInput: 'Need to call Dana back',
    aiReason: 'This looks like a follow-up action and it is already overdue.',
    source: 'manual',
    scheduleKind: 'flexible',
    slotIndex: 0,
    slotOrder: 0,
    isOverdue: true,
  },
  {
    id: 'task-recap',
    title: "Email last week's recap",
    kind: 'upcoming',
    date: TODAY,
    dateLabel: 'anytime',
    done: false,
    bucket: 'act',
    timeSlot: 'today',
    source: 'manual',
    scheduleKind: 'flexible',
    slotIndex: 0,
    slotOrder: 100,
  },
  {
    id: 'task-prep',
    title: 'Prep for manager 1:1',
    sublabel: '2 hr lead time',
    kind: 'urgent',
    date: TODAY,
    dateLabel: '1 PM',
    link: 'Manager 1:1 · 3 PM',
    done: false,
    bucket: 'act',
    timeSlot: 'today',
    leadTimeMins: 120,
    rawInput: 'need to prep for the one on one with my manager on thursday',
    aiReason: 'This is a prep action linked to a calendar meeting, so it should stay in Act with lead time.',
    subtasks: [
      { id: 'subtask-prep-notes', title: 'Review last 1:1 notes', done: false },
      { id: 'subtask-prep-topics', title: 'Pick 2 topics to raise', done: false },
    ],
    notes: '',
    source: 'calendar',
    relations: [{ type: 'event', id: 'e2', label: 'Manager 1:1' }],
    scheduleKind: 'flexible',
    slotIndex: 1,
    slotOrder: 0,
  },
  {
    id: 'task-deploy',
    title: 'Review deployment',
    kind: 'upcoming',
    date: TODAY,
    dateLabel: 'anytime',
    done: false,
    bucket: 'act',
    timeSlot: 'today',
    source: 'manual',
    scheduleKind: 'flexible',
    slotIndex: 2,
    slotOrder: 0,
  },
  {
    id: 'task-pr-tal',
    title: 'Review PR from Tal',
    kind: 'faded',
    date: TOMORROW,
    dateLabel: 'tomorrow',
    datePill: 'upcoming',
    done: false,
    bucket: 'act',
    timeSlot: 'tomorrow',
    source: 'manual',
    scheduleKind: 'flexible',
    slotIndex: 0,
    slotOrder: 0,
  },
  {
    id: 'task-dentist',
    title: 'Book dentist appointment',
    kind: 'faded',
    date: null,
    dateLabel: 'stash',
    done: false,
    bucket: 'act',
    timeSlot: 'someday',
    source: 'manual',
    scheduleKind: 'flexible',
    slotIndex: 0,
    slotOrder: 100,
  },
  {
    id: 'task-birthday',
    title: "Plan dad's birthday gift",
    kind: 'faded',
    date: IN_THREE_DAYS,
    dateLabel: 'in 3 days',
    done: false,
    bucket: 'act',
    timeSlot: 'in-a-few-days',
    source: 'manual',
    scheduleKind: 'flexible',
    slotIndex: 0,
    slotOrder: 0,
  },
];

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    date: TODAY,
    startTime: '10:30',
    endTime: '10:45',
    label: 'Daily standup',
    sublabel: '15 min',
    source: 'calendar',
  },
  {
    id: 'e2',
    date: TODAY,
    startTime: '15:00',
    endTime: '15:30',
    label: 'Manager 1:1',
    sublabel: '30 min · with Maya · Zoom',
    source: 'calendar',
    relations: [{ type: 'person', id: 'person-maya', label: 'Maya' }],
  },
];

type AppState = {
  screen: Screen;
  theme: Theme;
  tasks: Task[];
  events: CalendarEvent[];
  expandedItemId: string | null;
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

export const useAppStore = create<AppState>((set) => ({
  screen: 'today',
  theme: 'light',
  tasks: MOCK_TASKS,
  events: MOCK_EVENTS,
  expandedItemId: null,
  setScreen: (screen) => set({ screen }),
  setTheme: (theme) => set({ theme }),
  expandItem: (id) => set({ expandedItemId: id }),
  toggleDone: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    })),
  addSubtask: (taskId, title) =>
    set((state) => {
      const trimmedTitle = title.trim();
      if (trimmedTitle.length === 0) return {};

      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: [
                  ...(t.subtasks ?? []),
                  { id: createId('subtask'), title: trimmedTitle, done: false },
                ],
              }
            : t,
        ),
      };
    }),
  toggleSubtask: (taskId, subtaskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: (t.subtasks ?? []).map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
              ),
            }
          : t,
      ),
    })),
  removeSubtask: (taskId, subtaskId) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: (t.subtasks ?? []).filter((subtask) => subtask.id !== subtaskId) }
          : t,
      ),
    })),
  setNotes: (taskId, notes) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, notes } : t)),
    })),
  setLeadTime: (taskId, leadTimeMins) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        if (leadTimeMins === undefined) {
          const task = { ...t };
          delete task.leadTimeMins;
          return task;
        }
        return { ...t, leadTimeMins };
      }),
    })),
  planTaskForDate: (taskId, date, dateLabel, timeSlot) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, date, dateLabel, timeSlot, isOverdue: false } : t,
      ),
    })),
  changeBucket: (taskId, bucket) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, bucket } : t)),
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      expandedItemId: state.expandedItemId === taskId ? null : state.expandedItemId,
    })),
  reorderTask: (id, newSlotIndex, newSlotOrder) =>
    set((state) => {
      const updated = state.tasks.map((t) =>
        t.id === id ? { ...t, slotIndex: newSlotIndex, slotOrder: newSlotOrder } : t,
      );

      // Re-number any slot where values are too close (< 1 apart)
      const tasksInSlot = updated
        .filter((t) => t.scheduleKind === 'flexible' && t.slotIndex === newSlotIndex)
        .sort((a, b) => a.slotOrder - b.slotOrder);

      const needsRenumber = tasksInSlot.some((t, i) => {
        const next = tasksInSlot[i + 1];
        return next !== undefined && Math.abs(next.slotOrder - t.slotOrder) < 1;
      });

      if (!needsRenumber) return { tasks: updated };

      const renumbered = new Map<string, number>();
      tasksInSlot.forEach((t, i) => renumbered.set(t.id, i * 100));

      return {
        tasks: updated.map((t) => {
          const newOrder = renumbered.get(t.id);
          return newOrder !== undefined ? { ...t, slotOrder: newOrder } : t;
        }),
      };
    }),
}));
