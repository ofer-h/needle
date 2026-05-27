/**
 * Drop-in Today UI store backed by v2 domain state + adapter selectors.
 * Swap `import { useAppStore } from './store'` → `import { useAppStoreV2 as useAppStore } from './store-v2-today-adapter'`
 */
import { create } from 'zustand';
import type { Bucket, CalendarEvent, Screen, Task, Theme, TimeSlot } from '../../shared/types';
import { toISODate } from '../utils/date';
import { selectTodayViewModel } from './selectors-v2';
import { useV2Store, type V2Store } from './store-v2';

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
  changeBucket: (taskId: string, bucket: Bucket) => void;
  deleteTask: (taskId: string) => void;
  reorderTask: (id: string, newSlotIndex: number, newSlotOrder: number) => void;
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function syncViewFromV2(v2: V2Store): Pick<AppState, 'tasks' | 'events'> {
  return selectTodayViewModel(v2, toISODate() as import('../../shared/domain-v2').ISODate);
}

function patchItemStatus(v2: V2Store, itemId: string, status: 'open' | 'done'): V2Store {
  return {
    ...v2,
    items: v2.items.map((item) =>
      item.id === itemId
        ? { ...item, status, updatedAt: new Date().toISOString() as import('../../shared/domain-v2').ISODateTime }
        : item,
    ),
  };
}

function applyV2Patch(partial: Partial<V2Store>): void {
  useV2Store.setState(partial);
  const next = useV2Store.getState();
  const view = syncViewFromV2(next);
  useAppStoreV2.setState(view);
}

const initialV2 = useV2Store.getState();
const initialView = syncViewFromV2(initialV2);

export const useAppStoreV2 = create<AppState>((set, get) => ({
  screen: 'today',
  theme: 'light',
  tasks: initialView.tasks,
  events: initialView.events,
  expandedItemId: null,
  setScreen: (screen) => set({ screen }),
  setTheme: (theme) => set({ theme }),
  expandItem: (id) => set({ expandedItemId: id }),
  toggleDone: (id) => {
    const v2 = useV2Store.getState();
    const item = v2.items.find((i) => i.id === id);
    if (item === undefined) return;
    const nextStatus = item.status === 'done' ? 'open' : 'done';
    applyV2Patch(patchItemStatus(v2, id, nextStatus));
  },
  addSubtask: (taskId, title) => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) return;
    const v2 = useV2Store.getState();
    const childId = createId('item') as import('../../shared/domain-v2').ItemId;
    const now = new Date().toISOString() as import('../../shared/domain-v2').ISODateTime;
    const manualSource = v2.sources.find((s) => s.kind === 'manual');
    const child: import('../../shared/domain-v2').Item = {
      id: childId,
      workspaceId: v2.workspace.id,
      kind: 'task',
      bucket: 'act',
      title: trimmedTitle,
      status: 'open',
      visibility: 'workspace',
      commitmentLevel: 'soft',
      ...(manualSource !== undefined ? { sourceId: manualSource.id } : {}),
      createdByActorId: v2.meActorId,
      updatedByActorId: v2.meActorId,
      createdAt: now,
      updatedAt: now,
    };
    const relation: import('../../shared/domain-v2').ItemRelation = {
      id: createId('rel') as import('../../shared/domain-v2').ItemRelationId,
      workspaceId: v2.workspace.id,
      fromItemId: taskId as import('../../shared/domain-v2').ItemId,
      toItemId: childId,
      relationType: 'contains',
      sortOrder: v2.itemRelations.filter((r) => r.fromItemId === taskId).length,
      createdByActorId: v2.meActorId,
      createdAt: now,
    };
    applyV2Patch({
      items: [...v2.items, child],
      itemRelations: [...v2.itemRelations, relation],
    });
  },
  toggleSubtask: (taskId, subtaskId) => {
    const v2 = useV2Store.getState();
    const child = v2.items.find((i) => i.id === subtaskId);
    if (child === undefined) return;
    applyV2Patch(patchItemStatus(v2, subtaskId, child.status === 'done' ? 'open' : 'done'));
  },
  removeSubtask: (_taskId, subtaskId) => {
    const v2 = useV2Store.getState();
    applyV2Patch({
      items: v2.items.filter((i) => i.id !== subtaskId),
      itemRelations: v2.itemRelations.filter((r) => r.toItemId !== subtaskId),
    });
  },
  setNotes: (_taskId, _notes) => {
    // Notes live on Item.body in v2; UI notes field not wired in Phase B adapter.
  },
  setLeadTime: (_taskId, _leadTimeMins) => {
    // Lead time derived from ItemPlan.relativeTo in v2; mutation deferred to Phase E.
  },
  planTaskForDate: (taskId, date, _dateLabel, _timeSlot) => {
    const v2 = useV2Store.getState();
    const now = new Date().toISOString() as import('../../shared/domain-v2').ISODateTime;
    applyV2Patch({
      itemPlans: v2.itemPlans.map((plan) => {
        if (plan.itemId !== taskId) return plan;
        if (date === null) {
          const stashPlan = { ...plan, mode: 'stash' as const, updatedAt: now };
          delete (stashPlan as { planDate?: import('../../shared/domain-v2').ISODate }).planDate;
          return stashPlan;
        }
        return {
          ...plan,
          planDate: date as import('../../shared/domain-v2').ISODate,
          mode: 'float',
          updatedAt: now,
        };
      }),
    });
  },
  changeBucket: (taskId, bucket) => {
    const v2 = useV2Store.getState();
    const now = new Date().toISOString() as import('../../shared/domain-v2').ISODateTime;
    applyV2Patch({
      items: v2.items.map((item) =>
        item.id === taskId ? { ...item, bucket, updatedAt: now } : item,
      ),
    });
  },
  deleteTask: (taskId) => {
    const v2 = useV2Store.getState();
    applyV2Patch({
      items: v2.items.filter((i) => i.id !== taskId),
      itemPlans: v2.itemPlans.filter((p) => p.itemId !== taskId),
      itemRelations: v2.itemRelations.filter(
        (r) => r.fromItemId !== taskId && r.toItemId !== taskId,
      ),
    });
    const expanded = get().expandedItemId;
    if (expanded === taskId) set({ expandedItemId: null });
  },
  reorderTask: (id, newSlotIndex, newSlotOrder) => {
    const v2 = useV2Store.getState();
    const now = new Date().toISOString() as import('../../shared/domain-v2').ISODateTime;
    applyV2Patch({
      itemPlans: v2.itemPlans.map((plan) =>
        plan.itemId === id ? { ...plan, slotIndex: newSlotIndex, slotOrder: newSlotOrder, updatedAt: now } : plan,
      ),
    });
  },
}));
