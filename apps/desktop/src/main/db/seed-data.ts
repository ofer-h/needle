import type { CalendarEvent, Task } from '@needle/domain/types';

function toISODate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysISO(isoDate: string, days: number): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Demo tasks/events mirrored from src/renderer/state/store.ts mock data. */
export function buildSeedTasksAndEvents(): { tasks: Task[]; events: CalendarEvent[] } {
  const today = toISODate();
  const yesterday = addDaysISO(today, -1);
  const tomorrow = addDaysISO(today, 1);
  const inThreeDays = addDaysISO(today, 3);

  const tasks: Task[] = [
    {
      id: 'task-dana',
      title: 'Call back Dana',
      sublabel: 'from yesterday',
      kind: 'urgent',
      date: yesterday,
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
      date: today,
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
      date: today,
      dateLabel: '1 PM',
      link: 'Manager 1:1 · 3 PM',
      done: false,
      bucket: 'act',
      timeSlot: 'today',
      leadTimeMins: 120,
      rawInput: 'need to prep for the one on one with my manager on thursday',
      aiReason:
        'This is a prep action linked to a calendar meeting, so it should stay in Act with lead time.',
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
      date: today,
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
      date: tomorrow,
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
      date: inThreeDays,
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

  const events: CalendarEvent[] = [
    {
      id: 'e1',
      date: today,
      startTime: '10:30',
      endTime: '10:45',
      label: 'Daily standup',
      sublabel: '15 min',
      source: 'calendar',
    },
    {
      id: 'e2',
      date: today,
      startTime: '15:00',
      endTime: '15:30',
      label: 'Manager 1:1',
      sublabel: '30 min · with Maya · Zoom',
      source: 'calendar',
      relations: [{ type: 'person', id: 'person-maya', label: 'Maya' }],
    },
  ];

  return { tasks, events };
}
