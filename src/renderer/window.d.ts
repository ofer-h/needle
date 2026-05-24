import type { Theme, Screen, Task, CaptureResult } from '../shared/types';

declare global {
  interface Window {
    api: {
      app: {
        getTheme(): Promise<Theme>;
        onNavigate(cb: (screen: Screen) => void): () => void;
      };
      tasks: {
        create(req: { rawInput: string }): Promise<{ task: Task; result: CaptureResult }>;
        list(req: { scope: 'today' }): Promise<Task[]>;
        setDone(req: { id: string; done: boolean }): Promise<void>;
      };
    };
  }
}

export {};
