import type { Theme, Screen, Task, CaptureResult, ClassifiedItem } from '../shared/types';

declare global {
  interface Window {
    api: {
      app: {
        getTheme(): Promise<Theme>;
        onNavigate(cb: (screen: Screen) => void): () => void;
      };
      tasks: {
        classify(req: { rawInput: string }): Promise<CaptureResult>;
        confirm(req: { rawInput: string; items: ClassifiedItem[] }): Promise<Task[]>;
        list(req: { scope: 'today' }): Promise<Task[]>;
        setDone(req: { id: string; done: boolean }): Promise<void>;
      };
    };
  }
}

export {};
