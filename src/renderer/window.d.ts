import type { Screen, Theme } from '../shared/types';
import type { TorchClosePayload, TorchShowPayload } from '../shared/ipc-contracts';

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
      };
    };
  }
}
