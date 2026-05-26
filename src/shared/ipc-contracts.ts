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
  /** When true the hero banner shows meeting-safe skip reason labels. */
  isMeeting?: boolean;
  /** HH:MM local time of the linked meeting occurrence. Banner uses this to
   * render a live "in Xm" countdown next to the title. */
  meetingStartTime?: string;
};

export type TorchDismissReason = 'acknowledged' | 'timeout' | 'skipped';

export type TorchClosePayload = {
  reason: TorchDismissReason;
  correlationId: string;
  /** Present when reason is 'skipped'. Human-readable skip category. */
  skipReason?: string;
  /** Optional free-text notes entered by the user when skipping. */
  skipNotes?: string;
  /** Present when the user submitted a brain dump before dismissing. */
  brainDumpText?: string;
};

export type TorchSnoozePayload = {
  correlationId: string;
  /** How long to hold the overlay at near-zero intensity before re-escalating. */
  snoozeMs: number;
};

/** Broadcasted from main to all torch overlay windows and the hero banner
 * to switch between ambient-dim mode, interactive skip mode, and brain-dump mode. */
export type TorchHeroPayload = {
  mode: 'skip' | 'brain-dump' | 'normal';
};

export type TorchBrainDumpSubmitPayload = {
  correlationId: string;
  text: string;
};

/** Sent from a torch overlay renderer to toggle that window's click-through state.
 * Main identifies the sender via event.sender and calls setIgnoreMouseEvents accordingly. */
export type TorchSetInteractivePayload = {
  /** true → window receives clicks; false → window is pass-through (forward: true) */
  interactive: boolean;
};

export type TorchSkipConfirmPayload = {
  correlationId: string;
  reason: string;
  notes?: string;
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
