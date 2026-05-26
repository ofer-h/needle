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

export type CaptureShowPayload = {
  correlationId: string;
  title: string;
  subtitle: string;
};

export type CaptureEntryPayload = {
  correlationId: string;
  /** Stable local id minted by the capture window, surfaced back so promote/dismiss can reference it. */
  entryId: string;
  body: string;
};

export type CapturePromotePayload = {
  correlationId: string;
  entryId: string;
};

export type CaptureCloseReason = 'completed' | 'dismissed';

export type CaptureClosePayload = {
  correlationId: string;
  reason: CaptureCloseReason;
};

export type IpcContracts = {
  'app:getTheme': { req: void; res: Theme };
};
