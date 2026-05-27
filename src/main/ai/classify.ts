import Anthropic from '@anthropic-ai/sdk';
import type { ClassificationResult } from '../../shared/types';
import { needleLog } from '../log';
import { mintFlowId, recordFlowEvent } from '../services/flow-health';
import { getApiKey, getApiKeySource } from './config';

const MODEL = 'claude-haiku-4-5-20251001';
const CLASSIFY_TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You classify quick-capture text for a personal productivity app.
Return ONLY valid JSON with this exact shape (no markdown, no extra keys):
{
  "bucket": "today" | "tomorrow" | "later" | "someday",
  "title": string,
  "suggestedDate": string | null,
  "suggestedTime": string | null,
  "reasoning": string,
  "confidence": number
}
Rules:
- bucket: when the user should act (today/tomorrow/later/someday).
- title: short imperative or noun phrase, max ~80 chars.
- suggestedDate: ISO date YYYY-MM-DD if implied, else null.
- suggestedTime: 24h HH:mm if implied, else null.
- reasoning: one short sentence for the user.
- confidence: 0.0 to 1.0.`;

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
  const buckets = ['today', 'tomorrow', 'later', 'someday'] as const;
  if (!buckets.includes(record.bucket as (typeof buckets)[number])) {
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

  const result: ClassificationResult = {
    bucket: record.bucket as ClassificationResult['bucket'],
    title: record.title.trim(),
    reasoning: record.reasoning.trim(),
    confidence: record.confidence,
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
