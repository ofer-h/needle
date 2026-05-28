import Anthropic from '@anthropic-ai/sdk';
import type { ClassificationResult, ParsedPlanningItem } from '../../shared/types';
import { needleLog } from '../log';
import { mintFlowId, recordFlowEvent } from '../services/flow-health';
import { getApiKey, getApiKeySource } from './config';

const MODEL = 'claude-haiku-4-5-20251001';
const CLASSIFY_TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You parse quick-capture text for an AI-assisted daily planning app.
Return ONLY valid JSON with this exact shape (no markdown, no extra keys):
{
  "bucket": "today" | "tomorrow" | "later" | "someday",
  "title": string,
  "suggestedDate": string | null,
  "suggestedTime": string | null,
  "reasoning": string,
  "confidence": number,
  "items": [
    {
      "id": string,
      "itemType": "task" | "event",
      "scheduleMode": "flexible" | "fixed",
      "title": string,
      "bucket": "today" | "tomorrow" | "later" | "someday",
      "suggestedDate": string | null,
      "suggestedTime": string | null,
      "reasoning": string,
      "confidence": number
    }
  ]
}
Rules:
- Split multiple intentions into separate items.
- itemType event only when the text describes a hard-time calendar commitment or appointment. Otherwise use task.
- scheduleMode fixed only when a strict wall-clock time is explicit. Otherwise use flexible.
- bucket: when the user should act (today/tomorrow/later/someday).
- title: short imperative or noun phrase, max ~80 chars.
- suggestedDate: ISO date YYYY-MM-DD if implied, else null.
- suggestedTime: 24h HH:mm if a strict time is implied, else null.
- reasoning: one short sentence for the user.
- confidence: 0.0 to 1.0.
- Top-level bucket/title should summarize the overall capture.`;

const BUCKETS = ['today', 'tomorrow', 'later', 'someday'] as const;
const ITEM_TYPES = ['task', 'event'] as const;
const SCHEDULE_MODES = ['flexible', 'fixed'] as const;

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (value === null || value === undefined || value === '') return undefined;
  return String(value);
}

function parsePlanningItems(record: Record<string, unknown>): ParsedPlanningItem[] | { error: string } {
  const rawItems = Array.isArray(record.items) ? record.items : undefined;
  if (rawItems === undefined || rawItems.length === 0) {
    const suggestedDate = optionalString(record, 'suggestedDate');
    const suggestedTime = optionalString(record, 'suggestedTime');
    const item: ParsedPlanningItem = {
      id: 'parsed-1',
      itemType: 'task',
      scheduleMode: suggestedTime === undefined ? 'flexible' : 'fixed',
      title: String(record.title).trim(),
      bucket: record.bucket as ClassificationResult['bucket'],
      reasoning: String(record.reasoning).trim(),
      confidence: Number(record.confidence),
    };
    if (suggestedDate !== undefined) item.suggestedDate = suggestedDate;
    if (suggestedTime !== undefined) item.suggestedTime = suggestedTime;
    return [item];
  }

  const items: ParsedPlanningItem[] = [];
  for (const [index, raw] of rawItems.entries()) {
    if (raw === null || typeof raw !== 'object') {
      return { error: 'Model returned invalid parsed item' };
    }

    const item = raw as Record<string, unknown>;
    if (!ITEM_TYPES.includes(item.itemType as ParsedPlanningItem['itemType'])) {
      return { error: 'Model returned invalid item type' };
    }
    if (!SCHEDULE_MODES.includes(item.scheduleMode as ParsedPlanningItem['scheduleMode'])) {
      return { error: 'Model returned invalid schedule mode' };
    }
    if (!BUCKETS.includes(item.bucket as ParsedPlanningItem['bucket'])) {
      return { error: 'Model returned invalid item bucket' };
    }
    if (typeof item.title !== 'string' || item.title.trim().length === 0) {
      return { error: 'Model returned invalid item title' };
    }
    if (typeof item.reasoning !== 'string') {
      return { error: 'Model returned invalid item reasoning' };
    }
    if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) {
      return { error: 'Model returned invalid item confidence' };
    }

    const suggestedDate = optionalString(item, 'suggestedDate');
    const suggestedTime = optionalString(item, 'suggestedTime');
    const parsedItem: ParsedPlanningItem = {
      id: optionalString(item, 'id') ?? `parsed-${index + 1}`,
      itemType: item.itemType as ParsedPlanningItem['itemType'],
      scheduleMode: item.scheduleMode as ParsedPlanningItem['scheduleMode'],
      title: item.title.trim(),
      bucket: item.bucket as ParsedPlanningItem['bucket'],
      reasoning: item.reasoning.trim(),
      confidence: item.confidence,
    };
    if (suggestedDate !== undefined) parsedItem.suggestedDate = suggestedDate;
    if (suggestedTime !== undefined) parsedItem.suggestedTime = suggestedTime;
    items.push(parsedItem);
  }

  return items;
}

function parseClassification(raw: string): ClassificationResult | { error: string } {
  const trimmed = raw.trim();
  const jsonText =
    trimmed.startsWith('```') ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '') : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { error: 'Model returned invalid JSON' };
  }

  if (parsed === null || typeof parsed !== 'object') {
    return { error: 'Model returned invalid classification' };
  }

  const record = parsed as Record<string, unknown>;
  if (!BUCKETS.includes(record.bucket as (typeof BUCKETS)[number])) {
    return { error: 'Model returned invalid bucket' };
  }
  if (typeof record.title !== 'string' || record.title.trim().length === 0) {
    return { error: 'Model returned invalid title' };
  }
  if (typeof record.reasoning !== 'string') {
    return { error: 'Model returned invalid reasoning' };
  }
  if (typeof record.confidence !== 'number' || record.confidence < 0 || record.confidence > 1) {
    return { error: 'Model returned invalid confidence' };
  }

  const parsedItems = parsePlanningItems(record);
  if ('error' in parsedItems) return parsedItems;

  const result: ClassificationResult = {
    bucket: record.bucket as ClassificationResult['bucket'],
    title: record.title.trim(),
    reasoning: record.reasoning.trim(),
    confidence: record.confidence,
    items: parsedItems,
  };
  if (record.suggestedDate !== null && record.suggestedDate !== undefined) {
    result.suggestedDate = String(record.suggestedDate);
  }
  if (record.suggestedTime !== null && record.suggestedTime !== undefined) {
    result.suggestedTime = String(record.suggestedTime);
  }
  return result;
}

function mapApiError(err: unknown): { error: string } {
  if (err instanceof Error && err.message === 'classification_timeout') {
    return { error: 'Classification timed out — check network and try again' };
  }
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 401) return { error: 'Invalid API key' };
    if (status === 429) return { error: 'Rate limited — try again shortly' };
    if (status >= 500) return { error: 'Anthropic service unavailable' };
  }
  return { error: 'Classification failed' };
}

export async function classify(text: string): Promise<ClassificationResult | { error: string }> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { error: 'Text cannot be empty' };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    needleLog('ai', 'classify skipped — no API key');
    return { error: 'Anthropic API key not configured' };
  }

  const keySource = getApiKeySource();
  const flowId = mintFlowId();
  needleLog('ai', 'classify start', { textLen: trimmed.length, keySource, flowId });
  recordFlowEvent({
    flowId,
    flow: 'classify',
    kind: 'start',
    meta: { textLen: trimmed.length, keySource },
  });

  const client = new Anthropic({ apiKey });
  const started = Date.now();

  try {
    const response = await Promise.race([
      client.messages.create({
        model: MODEL,
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: trimmed }],
      }),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => reject(new Error('classification_timeout')), CLASSIFY_TIMEOUT_MS);
      }),
    ]);

    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') {
      needleLog('ai', 'classify empty response', { ms: Date.now() - started });
      return { error: 'Empty model response' };
    }

    const parsed = parseClassification(block.text);
    const ms = Date.now() - started;
    if ('error' in parsed) {
      needleLog('ai', 'classify parse error', { ms, error: parsed.error, flowId });
      recordFlowEvent({
        flowId,
        flow: 'classify',
        kind: 'end',
        ms,
        outcome: 'error',
        meta: { error: parsed.error },
      });
    } else {
      needleLog('ai', 'classify ok', { ms, bucket: parsed.bucket, flowId });
      recordFlowEvent({
        flowId,
        flow: 'classify',
        kind: 'end',
        ms,
        outcome: 'ok',
        meta: { bucket: parsed.bucket },
      });
    }
    return parsed;
  } catch (err) {
    const mapped = mapApiError(err);
    const ms = Date.now() - started;
    needleLog('ai', 'classify failed', { ms, error: mapped.error, flowId });
    recordFlowEvent({
      flowId,
      flow: 'classify',
      kind: 'end',
      ms,
      outcome: 'error',
      meta: { error: mapped.error },
    });
    return mapped;
  }
}
