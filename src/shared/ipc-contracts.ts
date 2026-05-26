import type { Theme } from './types';

export type TorchShowPayload = {
  /** Stable correlation id provided by the requester. Used to match the close
   * notification back to the source intervention. */
  correlationId: string;
  title: string;
  subtitle: string;
  /** Auto-timeout in milliseconds. When elapsed without acknowledge, the torch
   * window emits `torch:dismiss` with reason `'timeout'`. */
  durationMs: number;
};

export type TorchDismissReason = 'acknowledged' | 'timeout';

export type TorchClosePayload = {
  reason: TorchDismissReason;
  correlationId: string;
};

export type IpcContracts = {
  'app:getTheme': { req: void; res: Theme };
};
