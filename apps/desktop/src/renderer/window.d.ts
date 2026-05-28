import type { CalendarEvent, CaptureEntry, ClassifyResponse, Screen, Task, Theme } from '@needle/domain/types';
import type { AppDiagnostics } from '@needle/contract';
import type { FlowHealthSnapshot } from '@needle/domain/flow-health';
import type {
  CaptureClosePayload,
  CaptureEntryPayload,
  CapturePromotePayload,
  CaptureShowPayload,
  DbCreatePlanningItemsPayload,
  TorchBrainDumpSubmitPayload,
  TorchClosePayload,
  TorchHeroPayload,
  TorchShowPayload,
  TorchSkipConfirmPayload,
  TorchSnoozePayload,
} from '@needle/contract';

declare global {
  interface Window {
    api: {
      app: {
        getTheme(): Promise<Theme>;
        getDiagnostics(): Promise<AppDiagnostics>;
        getFlowHealth(): Promise<FlowHealthSnapshot>;
        onNavigate(cb: (screen: Screen) => void): () => void;
      };
      torch: {
        show(payload: TorchShowPayload): void;
        hide(): void;
        dismiss(payload: TorchClosePayload): void;
        snooze(payload: TorchSnoozePayload): void;
        skipInit(correlationId: string): void;
        skipConfirm(payload: TorchSkipConfirmPayload): void;
        skipCancel(correlationId: string): void;
        brainDumpInit(correlationId: string): void;
        brainDumpSubmit(payload: TorchBrainDumpSubmitPayload): void;
        brainDumpCancel(correlationId: string): void;
        /** Toggle this window's click-through state. Call on mouseenter/mouseleave of interactive elements. */
        setInteractive(interactive: boolean): void;
        onPayload(cb: (payload: TorchShowPayload) => void): () => void;
        onClosed(cb: (payload: TorchClosePayload) => void): () => void;
        onCursor(cb: (point: { x: number; y: number }) => void): () => void;
        onSnoozed(cb: (payload: TorchSnoozePayload) => void): () => void;
        onHero(cb: (payload: TorchHeroPayload) => void): () => void;
      };
      db: {
        getTasks(): Promise<Task[]>;
        updateTask(id: string, patch: Partial<Task>): Promise<Task>;
        deleteTask(id: string): Promise<void>;
        addSubtask(taskId: string, title: string): Promise<Task>;
        toggleSubtask(taskId: string, subtaskId: string): Promise<Task>;
        removeSubtask(taskId: string, subtaskId: string): Promise<Task>;
        updateSubtask(
          taskId: string,
          subtaskId: string,
          patch: { title?: string; notes?: string },
        ): Promise<Task>;
        reorderSubtask(taskId: string, subtaskId: string, toIndex: number): Promise<void>;
        moveSubtask(taskId: string, subtaskId: string, targetTaskId: string): Promise<void>;
        promoteSubtask(taskId: string, subtaskId: string): Promise<void>;
        nestTask(taskId: string, targetTaskId: string): Promise<void>;
        getEvents(): Promise<CalendarEvent[]>;
        updateEvent(id: string, patch: Partial<CalendarEvent>): Promise<CalendarEvent>;
        deleteEvent(id: string): Promise<void>;
        convertEventToTask(id: string): Promise<void>;
        createPlanningItems(payload: DbCreatePlanningItemsPayload): Promise<{ tasks: Task[]; events: CalendarEvent[] }>;
        addCapture(body: string): Promise<CaptureEntry>;
        getCaptureEntries(limit?: number): Promise<CaptureEntry[]>;
      };
      ai: {
        classify(text: string): Promise<ClassifyResponse>;
        setApiKey(apiKey: string): Promise<{ ok: true } | { error: string }>;
        hasApiKey(): Promise<boolean>;
      };
      capture: {
        show(payload: CaptureShowPayload): void;
        hide(): void;
        addEntry(payload: CaptureEntryPayload): void;
        promoteEntry(payload: CapturePromotePayload): void;
        dismissEntry(payload: CapturePromotePayload): void;
        close(payload: CaptureClosePayload): void;
        onPayload(cb: (payload: CaptureShowPayload) => void): () => void;
        onEntryAdded(cb: (payload: CaptureEntryPayload) => void): () => void;
        onEntryPromoted(cb: (payload: CapturePromotePayload) => void): () => void;
        onEntryDismissed(cb: (payload: CapturePromotePayload) => void): () => void;
        onClosed(cb: (payload: CaptureClosePayload) => void): () => void;
      };
    };
  }
}
