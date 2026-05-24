import type { Bucket, CaptureResult, ClassifiedItem, TimeSlot } from '../../shared/types';
import { trimTitle } from './classify-parse';

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  today: 'today',
  tomorrow: 'tomorrow',
  'in-a-few-days': 'the next few days',
  'next-week': 'next week',
  someday: 'someday',
};

function inferTimeSlot(text: string): TimeSlot {
  const lower = text.toLowerCase();
  if (lower.includes('someday')) return 'someday';
  if (lower.includes('next week')) return 'next-week';
  if (lower.includes('in a few days')) return 'in-a-few-days';
  if (lower.includes('tomorrow')) return 'tomorrow';
  return 'today';
}

function stripListMarker(line: string): string {
  return line.replace(/^[\s•\-*–—]+/, '').replace(/^\d+[.)]\s*/, '').trim();
}

function splitIntoSegments(rawInput: string): string[] {
  const trimmed = rawInput.trim();
  const lines = trimmed
    .split('\n')
    .map(stripListMarker)
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const bulletParts = trimmed
    .split(/\s*[•\-–—]\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (bulletParts.length > 1) return bulletParts;

  const numberedParts = trimmed
    .split(/\s*(?:\d+[.)]\s+)/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (numberedParts.length > 1) return numberedParts;

  const andParts = trimmed
    .split(/\s*,\s*|\s+and also\s+|\s+also\s+|\s+and then\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (andParts.length > 1 && andParts.every((part) => part.split(/\s+/).length >= 2)) {
    return andParts;
  }

  return [trimmed];
}

function titleFromSegment(segment: string): string {
  const words = segment.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Untitled';
  const cleaned = words.join(' ');
  return trimTitle(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
}

function classifySegment(segment: string): ClassifiedItem {
  const timeSlot = inferTimeSlot(segment);
  return {
    bucket: 'act' as Bucket,
    timeSlot,
    title: titleFromSegment(segment),
    sourceText: segment,
  };
}

export function classifyStubWithLatency(rawInput: string): CaptureResult {
  const start = performance.now();
  const segments = splitIntoSegments(rawInput);
  const items = segments.map(classifySegment);
  const latencyMs = Math.round(performance.now() - start);

  const explanation =
    items.length > 1
      ? `Split into ${items.length} tasks and cleaned up phrasing (offline mode).`
      : `Saved as an Act item for ${TIME_SLOT_LABELS[items[0]?.timeSlot ?? 'today']}.`;

  return { items, explanation, latencyMs };
}
