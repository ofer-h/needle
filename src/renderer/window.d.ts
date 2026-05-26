import type { Screen, Theme } from '../shared/types';
import type {
  CaptureClosePayload,
  CaptureEntryPayload,
  CapturePromotePayload,
  CaptureShowPayload,
  TorchClosePayload,
  TorchShowPayload,
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
        onPayload(cb: (payload: TorchShowPayload) => void): () => void;
        onClosed(cb: (payload: TorchClosePayload) => void): () => void;
        onCursor(cb: (point: { x: number; y: number }) => void): () => void;
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
