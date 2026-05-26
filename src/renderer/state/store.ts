import { create } from 'zustand';
import type { Screen, Theme, Task, CalendarEvent } from '../../shared/types';

const MOCK_TASKS: Task[] = [
  {
    id: 'task-dana',
    title: 'Call back Dana',
    sublabel: 'from yesterday',
    kind: 'urgent',
    date: 'yesterday',
    datePill: 'urgent',
    done: false,
    bucket: 'act',
    timeSlot: 'today',
    scheduleKind: 'flexible',
    slotIndex: 0,
    slotOrder: 0,
    isOverdue: true,
  },
  {
    id: 'task-recap',
    title: "Email last week's recap",
    kind: 'upcoming',
    date: 'anytime',
    done: false,
    bucket: 'act',
    timeSlot: 'today',
    scheduleKind: 'flexible',
    slotIndex: 0,
    slotOrder: 100,
  },
  {
    id: 'task-standup',
    title: 'Daily standup',
    sublabel: '15 min',
    kind: 'upcoming',
    date: '10:30',
    done: false,
    bucket: 'act',
    timeSlot: 'today',
    scheduleKind: 'fixed',
    startTime: '10:30',
    slotIndex: 0,
    slotOrder: 0,
  },
  {
    id: 'task-prep',
    title: 'Prep for manager 1:1',
    sublabel: '2 hr lead time',
    kind: 'urgent',
    date: '1 PM',
    link: 'Manager 1:1 · 3 PM',
    done: false,
    bucket: 'act',
    timeSlot: 'today',
    scheduleKind: 'flexible',
    slotIndex: 1,
    slotOrder: 0,
  },
  {
    id: 'task-deploy',
    title: 'Review deployment',
    kind: 'upcoming',
    date: 'anytime',
    done: false,
    bucket: 'act',
    timeSlot: 'today',
    scheduleKind: 'flexible',
    slotIndex: 2,
    slotOrder: 0,
  },
];

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', startTime: '10:30', label: 'Daily standup', sublabel: '15 min' },
  { id: 'e2', startTime: '15:00', label: 'Manager 1:1', sublabel: '30 min · with Maya · Zoom' },
];

type AppState = {
  screen: Screen;
  theme: Theme;
  tasks: Task[];
  events: CalendarEvent[];
  setScreen: (screen: Screen) => void;
  setTheme: (theme: Theme) => void;
  toggleDone: (id: string) => void;
  reorderTask: (id: string, newSlotIndex: number, newSlotOrder: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  screen: 'today',
  theme: 'light',
  tasks: MOCK_TASKS,
  events: MOCK_EVENTS,
  setScreen: (screen) => set({ screen }),
  setTheme: (theme) => set({ theme }),
  toggleDone: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
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
