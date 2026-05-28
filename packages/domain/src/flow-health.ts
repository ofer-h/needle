/** Lifecycle marker for a correlated multi-step or IPC flow. */
export type FlowEventKind = 'start' | 'end' | 'error' | 'cancel';

export type FlowEvent = {
  /** Correlates start/end/cancel for one user-visible operation. */
  flowId: string;
  /** Stable flow name, e.g. `classify`, `setApiKey`, `hydrateDb`. */
  flow: string;
  kind: FlowEventKind;
  /** Epoch ms when the event was recorded. */
  at: number;
  /** Elapsed ms for `end` / `error` / `cancel`. */
  ms?: number;
  outcome?: 'ok' | 'error' | 'cancelled';
  /** Safe metadata only — never API keys or full user text. */
  meta?: Record<string, unknown>;
};

export type LastClassifySummary = {
  flowId: string;
  outcome: 'ok' | 'error';
  ms: number;
  at: number;
  bucket?: string;
  error?: string;
};

export type FlowHealthSnapshot = {
  events: FlowEvent[];
  lastClassify: LastClassifySummary | null;
};
