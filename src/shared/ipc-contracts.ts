import type { Theme, Task, CaptureResult } from './types';

export type IpcContracts = {
  'app:getTheme': { req: void; res: Theme };
  'tasks:create': { req: { rawInput: string }; res: { task: Task; result: CaptureResult } };
  'tasks:list': { req: { scope: 'today' }; res: Task[] };
  'tasks:setDone': { req: { id: string; done: boolean }; res: void };
};
