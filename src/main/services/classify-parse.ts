import type { Bucket, ClassifiedItem, TimeSlot } from '../../shared/types';

export const TIME_SLOTS: TimeSlot[] = [
  'today',
  'tomorrow',
  'in-a-few-days',
  'next-week',
  'someday',
];

export const BUCKETS: Bucket[] = ['act', 'remember'];

const DATE_PILLS = ['urgent', 'upcoming'] as const;

export function isTimeSlot(value: unknown): value is TimeSlot {
  return typeof value === 'string' && TIME_SLOTS.includes(value as TimeSlot);
}

export function isBucket(value: unknown): value is Bucket {
  return typeof value === 'string' && BUCKETS.includes(value as Bucket);
}

function isDatePill(value: unknown): value is 'urgent' | 'upcoming' {
  return typeof value === 'string' && (DATE_PILLS as readonly string[]).includes(value);
}

export function trimTitle(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 8).join(' ');
}

export function parseClassifiedItems(payload: unknown): ClassifiedItem[] {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Classification payload must be an object');
  }

  const data = payload as Record<string, unknown>;
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('Classification must include a non-empty items array');
  }

  return data.items.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Invalid item at index ${index}`);
    }

    const item = entry as Record<string, unknown>;
    if (!isBucket(item.bucket)) throw new Error(`Invalid bucket at index ${index}`);
    if (!isTimeSlot(item.timeSlot)) throw new Error(`Invalid timeSlot at index ${index}`);
    if (typeof item.title !== 'string' || !item.title.trim()) {
      throw new Error(`Invalid title at index ${index}`);
    }

    const parsed: ClassifiedItem = {
      bucket: item.bucket,
      timeSlot: item.timeSlot,
      title: trimTitle(item.title),
    };

    if (typeof item.sourceText === 'string' && item.sourceText.trim()) {
      parsed.sourceText = item.sourceText.trim();
    }
    if (typeof item.sublabel === 'string' && item.sublabel.trim()) {
      parsed.sublabel = item.sublabel.trim();
    }
    if (typeof item.link === 'string' && item.link.trim()) {
      parsed.link = item.link.trim();
    }
    if (isDatePill(item.datePill)) {
      parsed.datePill = item.datePill;
    }

    return parsed;
  });
}

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(jsonText) as unknown;
}
