import type { CalendarEvent, CaptureEntry, ClassifyResponse, Screen, Task, Theme } from '../shared/types';
import type {
  CaptureClosePayload,
  CaptureEntryPayload,
  CapturePromotePayload,
  CaptureShowPayload,
  DbCreateEventPayload,
  DbCreateTaskPayload,
  TorchBrainDumpSubmitPayload,
  TorchClosePayload,
  TorchHeroPayload,
  TorchShowPayload,
  TorchSkipConfirmPayload,
  TorchSnoozePayload,
} from '../shared/ipc-contracts';

declare global {
  interface Window {
    api: {
      app: {
        getTheme(): Promise<Theme>;
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
        getTasksByDate(date: string): Promise<Task[]>;
        createTask(payload: DbCreateTaskPayload): Promise<Task>;
        updateTask(id: string, patch: Partial<Task>): Promise<Task>;
        deleteTask(id: string): Promise<void>;
        getEvents(): Promise<CalendarEvent[]>;
        createEvent(payload: DbCreateEventPayload): Promise<CalendarEvent>;
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
