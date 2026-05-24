import type { CaptureResult } from '../../shared/types';
import {
  extractJson,
  parseClassifiedItems,
} from './classify-parse';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
};

function buildPrompt(rawInput: string): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `You organize raw brain-dump captures into clean tasks for a personal productivity app (user has ADHD).
Today is ${today}.

Respond with JSON only (no markdown fences):
{
  "explanation": "one friendly sentence summarizing what you did",
  "items": [
    {
      "bucket": "act" | "remember",
      "timeSlot": "today" | "tomorrow" | "in-a-few-days" | "next-week" | "someday",
      "title": "clean label, max 8 words, correct grammar",
      "sourceText": "short snippet from raw input",
      "sublabel": "optional context, e.g. lead time or note detail",
      "link": "optional related link or event name",
      "datePill": "urgent" | "upcoming" | null
    }
  ]
}

You control ALL fields for each item:
- title: fix grammar/spelling; act items start with a verb
- bucket: "act" = to-do; "remember" = reference/note
- timeSlot: when to surface it — infer from words like today, tomorrow, next week, thursday, someday
- sublabel: brief helpful context (optional)
- link: meeting/person/url reference if mentioned (optional)
- datePill: "urgent" if due today/overdue tone; "upcoming" if soon but not today; null otherwise

Multi-task: split distinct tasks into separate items (newlines, bullets, "also", commas between errands).
Single capture: return exactly one item.
Do NOT invent tasks not in the input.

Raw capture:
"""
${rawInput}
"""`;
}

function parseClassificationResponse(payload: unknown): Omit<CaptureResult, 'latencyMs'> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Classification payload must be an object');
  }

  const data = payload as Record<string, unknown>;
  if (typeof data.explanation !== 'string' || !data.explanation.trim()) {
    throw new Error('Invalid explanation');
  }

  const items = parseClassifiedItems(payload);
  return {
    items,
    explanation: data.explanation.trim(),
  };
}

export async function classifyWithAnthropic(rawInput: string): Promise<CaptureResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  const start = performance.now();

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildPrompt(rawInput) }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const text = data.content?.find((block) => block.type === 'text')?.text;
  if (!text) throw new Error('Anthropic response missing text content');

  const parsed = parseClassificationResponse(extractJson(text));
  const latencyMs = Math.round(performance.now() - start);

  return { ...parsed, latencyMs };
}
