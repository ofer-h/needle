import { randomUUID } from 'node:crypto';
import type { FlowEvent, FlowHealthSnapshot, LastClassifySummary } from '@needle/domain/flow-health';
import { needleLog } from '../log';

const MAX_EVENTS = 50;

const events: FlowEvent[] = [];
let lastClassify: LastClassifySummary | null = null;

export function mintFlowId(): string {
  return randomUUID();
}

export function recordFlowEvent(
  event: Omit<FlowEvent, 'at'> & { at?: number },
): void {
  const full: FlowEvent = { ...event, at: event.at ?? Date.now() };
  events.push(full);
  while (events.length > MAX_EVENTS) {
    events.shift();
  }

  const logMeta: Record<string, unknown> = {
    flowId: full.flowId,
    ...(full.ms !== undefined ? { ms: full.ms } : {}),
    ...(full.outcome !== undefined ? { outcome: full.outcome } : {}),
    ...(full.meta !== undefined ? full.meta : {}),
  };
  needleLog('flow', `${full.flow} ${full.kind}`, logMeta);

  if (full.flow === 'classify' && full.kind === 'end' && full.ms !== undefined) {
    const outcome = full.outcome === 'ok' ? 'ok' : 'error';
    const meta = full.meta ?? {};
    const summary: LastClassifySummary = {
      flowId: full.flowId,
      outcome,
      ms: full.ms,
      at: full.at,
      ...(typeof meta.bucket === 'string' ? { bucket: meta.bucket } : {}),
      ...(typeof meta.error === 'string' ? { error: meta.error } : {}),
    };
    lastClassify = summary;
  }
}

export function getFlowHealthSnapshot(): FlowHealthSnapshot {
  return {
    events: [...events],
    lastClassify,
  };
}
