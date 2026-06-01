import { describe, it, expect } from 'vitest';
import { parseDurationMinutes, addMinutesToTime } from './InlineAdd';

describe('parseDurationMinutes', () => {
  it('parses "30m"', () => expect(parseDurationMinutes('30m')).toBe(30));
  it('parses "1h"', () => expect(parseDurationMinutes('1h')).toBe(60));
  it('parses "1h30m"', () => expect(parseDurationMinutes('1h30m')).toBe(90));
  it('parses "90m"', () => expect(parseDurationMinutes('90m')).toBe(90));
  it('returns 0 for empty string', () => expect(parseDurationMinutes('')).toBe(0));
  it('returns 0 for garbage', () => expect(parseDurationMinutes('abc')).toBe(0));
  it('is case-insensitive', () => expect(parseDurationMinutes('2H')).toBe(120));
});

describe('addMinutesToTime', () => {
  it('adds 30m to 14:00', () => expect(addMinutesToTime('14:00', 30)).toBe('14:30'));
  it('rolls over midnight', () => expect(addMinutesToTime('23:45', 30)).toBe('00:15'));
  it('adds 90m to 10:00', () => expect(addMinutesToTime('10:00', 90)).toBe('11:30'));
  it('handles 0 minutes', () => expect(addMinutesToTime('09:00', 0)).toBe('09:00'));
});
