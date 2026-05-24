import type { Theme, Task, CaptureResult, ClassifiedItem } from './types';

export type IpcContracts = {
  'app:getTheme': { req: void; res: Theme };
  'tasks:classify': { req: { rawInput: string }; res: CaptureResult };
  'tasks:confirm': {
    req: { rawInput: string; items: ClassifiedItem[] };
    res: Task[];
  };
  'tasks:list': { req: { scope: 'today' }; res: Task[] };
  'tasks:setDone': { req: { id: string; done: boolean }; res: void };
};
