import type { Bucket, CaptureResult, TimeSlot } from '../../shared/types';

type StubClassification = {
  bucket: Bucket;
  timeSlot: TimeSlot;
  title: string;
  explanation: string;
};

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  today: 'today',
  tomorrow: 'tomorrow',
  'in-a-few-days': 'the next few days',
  'next-week': 'next week',
  someday: 'someday',
};

function inferTimeSlot(rawInput: string): TimeSlot {
  const lower = rawInput.toLowerCase();
  if (lower.includes('someday')) return 'someday';
  if (lower.includes('next week')) return 'next-week';
  if (lower.includes('in a few days')) return 'in-a-few-days';
  if (lower.includes('tomorrow')) return 'tomorrow';
  return 'today';
}

function titleFromRawInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  const firstLine = trimmed.split('\n').find((line) => line.trim())?.trim() ?? trimmed;
  const words = firstLine.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Untitled';
  return words.slice(0, 8).join(' ');
}

export function classifyStub(rawInput: string): StubClassification {
  const timeSlot = inferTimeSlot(rawInput);
  const title = titleFromRawInput(rawInput);
  const bucket: Bucket = 'act';

  return {
    bucket,
    timeSlot,
    title,
    explanation: `Saved as an Act item for ${TIME_SLOT_LABELS[timeSlot]}.`,
  };
}

export function classifyStubWithLatency(rawInput: string): CaptureResult {
  const start = performance.now();
  const classified = classifyStub(rawInput);
  const latencyMs = Math.round(performance.now() - start);

  return {
    bucket: classified.bucket,
    timeSlot: classified.timeSlot,
    title: classified.title,
    explanation: classified.explanation,
    latencyMs,
  };
}
