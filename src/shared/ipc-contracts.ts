import type { Theme } from './types';

export type IpcContracts = {
  'app:getTheme': { req: void; res: Theme };
};
