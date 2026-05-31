/* Mocked "AI" quick-add parser — deterministic, no LLM. Pulls a start time,
 * duration, kind, and commitment out of free text so the InlineAdd ✨ toggle can
 * feel smart while staying fully scripted. */

import type { NewItemInput } from './mutate';

export type ParsedAdd = {
  input: NewItemInput;
  /** '**' (or "subtask:") nests under the previously added item. */
  level: 'item' | 'subtask';
};

const RE_TIME = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
const RE_DURATION = /\b(?:for\s+)?(\d{1,3})\s*(m|min|mins|minutes|h|hr|hrs|hour|hours)\b/i;
const RE_REMEMBER = /^(?:remember|note)\s*:?\s*/i;
const RE_MUST = /\b(must|unmissable|critical)\b|!!/i;

function to24h(hour: number, min: number, ampm?: string): string {
  let h = hour;
  if (ampm) {
    const lower = ampm.toLowerCase();
    if (lower === 'pm' && h < 12) h += 12;
    if (lower === 'am' && h === 12) h = 0;
  }
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

function toMinutes(n: number, unit: string): number {
  return /^h/.test(unit) ? n * 60 : n;
}

export function parseQuickAdd(text: string): ParsedAdd {
  let rest = text.trim();
  let level: ParsedAdd['level'] = 'item';

  if (/^\*\*/.test(rest) || /^subtask\s*:/i.test(rest)) {
    level = 'subtask';
    rest = rest.replace(/^\*\*\s*/, '').replace(/^subtask\s*:\s*/i, '');
  } else if (/^\*/.test(rest)) {
    rest = rest.replace(/^\*\s*/, '');
  }

  const input: NewItemInput = { title: rest };

  if (RE_REMEMBER.test(rest)) {
    input.kind = 'note';
    input.bucket = 'remember';
    rest = rest.replace(RE_REMEMBER, '');
  }

  // Duration first (so "30 min" isn't mistaken for a clock time).
  const dur = rest.match(RE_DURATION);
  if (dur) {
    input.durationMinutes = toMinutes(Number(dur[1]), dur[2]!.toLowerCase());
    rest = rest.replace(dur[0], '').trim();
  }

  // Time: only treat a bare number as a time when it has am/pm or a colon, to
  // avoid swallowing quantities ("buy 2 coffees").
  const time = rest.match(RE_TIME);
  if (time && (time[3] || time[2])) {
    const startTime = to24h(Number(time[1]), Number(time[2] ?? '0'), time[3] ?? undefined);
    input.startTime = startTime;
    input.kind = input.kind ?? 'task';
    input.commitmentLevel = 'firm';
    rest = rest.replace(time[0], '').trim();
  }

  if (RE_MUST.test(text)) {
    input.commitmentLevel = 'unmissable';
    rest = rest.replace(RE_MUST, '').trim();
  }

  // Clean leftover filler from removed tokens.
  input.title = rest
    .replace(/\b(at|for|by)\b\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!input.title) input.title = text.trim();

  return { input, level };
}
